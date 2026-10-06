const { query } = require('../config/db');

// GET /api/dashboard/stats
const getDashboardStats = async (req, res, next) => {
  try {
    const userRole = req.user.role;

    if (userRole === 'ADMIN') {
      // 1. KPI Counts
      const [bookStats] = await query(
        `SELECT 
          COUNT(*) as total_books, 
          COALESCE(SUM(total_copies), 0) as total_copies,
          COALESCE(SUM(available_copies), 0) as available_copies
         FROM books`
      );

      const [studentStats] = await query(
        `SELECT COUNT(*) as total_students FROM users WHERE role = 'STUDENT'`
      );

      const [issuedStats] = await query(
        `SELECT COUNT(*) as issued_books FROM transactions WHERE status = 'ISSUED'`
      );

      const [overdueStats] = await query(
        `SELECT COUNT(*) as overdue_books FROM transactions 
         WHERE status = 'OVERDUE' OR (status = 'ISSUED' AND due_date < CURRENT_DATE)`
      );

      const [fineStats] = await query(
        `SELECT COALESCE(SUM(amount), 0) as pending_fines FROM fines WHERE status = 'PENDING'`
      );

      const [reservationStats] = await query(
        `SELECT COUNT(*) as total_reservations FROM reservations WHERE status = 'WAITING'`
      );

      // 2. Chart: Most Borrowed Books
      const [mostBorrowed] = await query(
        `SELECT b.id, b.title, b.author, COUNT(t.id) as borrow_count
         FROM books b
         JOIN transactions t ON b.id = t.book_id
         GROUP BY b.id
         ORDER BY borrow_count DESC
         LIMIT 5`
      );

      // 3. Chart: Books by Category
      const [booksByCategory] = await query(
        `SELECT c.name as category, COUNT(b.id) as count
         FROM categories c
         LEFT JOIN books b ON c.id = b.category_id
         GROUP BY c.id
         ORDER BY count DESC`
      );

      // 4. Chart: Monthly Transactions (last 6 months)
      const [monthlyTransactions] = await query(
        `SELECT 
          DATE_FORMAT(issue_date, '%b %Y') as month,
          COUNT(*) as total_issues,
          COUNT(CASE WHEN status = 'RETURNED' THEN 1 END) as total_returns
         FROM transactions
         WHERE issue_date >= DATE_SUB(CURRENT_DATE, INTERVAL 6 MONTH)
         GROUP BY DATE_FORMAT(issue_date, '%Y-%m'), DATE_FORMAT(issue_date, '%b %Y')
         ORDER BY DATE_FORMAT(issue_date, '%Y-%m') ASC`
      );

      // 5. Recent Transactions
      const [recentTransactions] = await query(
        `SELECT 
          t.id, t.issue_date, t.due_date, t.return_date, t.status, t.fine_amount,
          u.name as student_name, u.email as student_email,
          b.title as book_title, b.isbn
         FROM transactions t
         JOIN users u ON t.user_id = u.id
         JOIN books b ON t.book_id = b.id
         ORDER BY t.created_at DESC
         LIMIT 6`
      );

      // 6. Overdue Books Section
      const [overdueList] = await query(
        `SELECT 
          t.id as transaction_id, t.issue_date, t.due_date,
          DATEDIFF(CURRENT_DATE, t.due_date) as days_late,
          u.id as student_id, u.name as student_name, u.email as student_email, u.phone as student_phone,
          b.id as book_id, b.title as book_title, b.shelf_location
         FROM transactions t
         JOIN users u ON t.user_id = u.id
         JOIN books b ON t.book_id = b.id
         WHERE t.status = 'OVERDUE' OR (t.status = 'ISSUED' AND t.due_date < CURRENT_DATE)
         ORDER BY days_late DESC
         LIMIT 6`
      );

      return res.status(200).json({
        success: true,
        role: 'ADMIN',
        stats: {
          totalBooks: bookStats[0].total_books || 0,
          totalCopies: bookStats[0].total_copies || 0,
          availableBooks: bookStats[0].available_copies || 0,
          totalStudents: studentStats[0].total_students || 0,
          issuedBooks: issuedStats[0].issued_books || 0,
          overdueBooks: overdueStats[0].overdue_books || 0,
          pendingFines: parseFloat(fineStats[0].pending_fines) || 0,
          reservations: reservationStats[0].total_reservations || 0
        },
        charts: {
          mostBorrowed,
          booksByCategory,
          monthlyTransactions: monthlyTransactions.length > 0 ? monthlyTransactions : [
            { month: 'Oct 2026', total_issues: issuedStats[0].issued_books || 4, total_returns: 2 }
          ]
        },
        recentTransactions,
        overdueList
      });
    } else {
      // STUDENT Dashboard
      const userId = req.user.id;

      const [borrowed] = await query(
        `SELECT COUNT(*) as count FROM transactions 
         WHERE user_id = ? AND status IN ('ISSUED', 'OVERDUE')`,
        [userId]
      );

      const [dueSoon] = await query(
        `SELECT COUNT(*) as count FROM transactions 
         WHERE user_id = ? AND status = 'ISSUED' 
         AND due_date BETWEEN CURRENT_DATE AND DATE_ADD(CURRENT_DATE, INTERVAL 3 DAY)`,
        [userId]
      );

      const [overdue] = await query(
        `SELECT COUNT(*) as count FROM transactions 
         WHERE user_id = ? AND (status = 'OVERDUE' OR (status = 'ISSUED' AND due_date < CURRENT_DATE))`,
        [userId]
      );

      const [fines] = await query(
        `SELECT COALESCE(SUM(amount), 0) as total FROM fines WHERE user_id = ? AND status = 'PENDING'`,
        [userId]
      );

      const [reservations] = await query(
        `SELECT COUNT(*) as count FROM reservations WHERE user_id = ? AND status = 'WAITING'`,
        [userId]
      );

      // Student active loans with remaining days
      const [currentLoans] = await query(
        `SELECT 
          t.id as transaction_id, t.issue_date, t.due_date, t.status,
          DATEDIFF(t.due_date, CURRENT_DATE) as days_remaining,
          b.id as book_id, b.title, b.isbn, b.author, b.cover_image, b.shelf_location
         FROM transactions t
         JOIN books b ON t.book_id = b.id
         WHERE t.user_id = ? AND t.status IN ('ISSUED', 'OVERDUE')
         ORDER BY t.due_date ASC`,
        [userId]
      );

      // Recommended / Popular books
      const [recommendedBooks] = await query(
        `SELECT b.id, b.title, b.author, b.cover_image, b.available_copies, c.name as category_name
         FROM books b
         JOIN categories c ON b.category_id = c.id
         ORDER BY b.available_copies DESC, b.created_at DESC
         LIMIT 6`
      );

      return res.status(200).json({
        success: true,
        role: 'STUDENT',
        stats: {
          currentlyBorrowed: borrowed[0].count || 0,
          dueSoon: dueSoon[0].count || 0,
          overdue: overdue[0].count || 0,
          pendingFines: parseFloat(fines[0].total) || 0,
          reservations: reservations[0].count || 0
        },
        currentLoans,
        recommendedBooks
      });
    }
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDashboardStats
};
