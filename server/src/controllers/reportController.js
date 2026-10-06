const { query } = require('../config/db');

// GET /api/reports
const getReports = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;

    let transDateClause = '';
    let transParams = [];

    if (startDate && endDate) {
      transDateClause = 'WHERE issue_date BETWEEN ? AND ?';
      transParams = [startDate, endDate];
    } else if (startDate) {
      transDateClause = 'WHERE issue_date >= ?';
      transParams = [startDate];
    } else if (endDate) {
      transDateClause = 'WHERE issue_date <= ?';
      transParams = [endDate];
    }

    // 1. Overall stats
    const [bookCount] = await query('SELECT COUNT(*) as count, COALESCE(SUM(total_copies), 0) as copies FROM books');
    const [studentCount] = await query('SELECT COUNT(*) as count FROM users WHERE role = "STUDENT"');
    
    const [transStats] = await query(
      `SELECT 
        COUNT(*) as total_transactions,
        COUNT(CASE WHEN status = 'ISSUED' THEN 1 END) as total_issued,
        COUNT(CASE WHEN status = 'RETURNED' THEN 1 END) as total_returned,
        COUNT(CASE WHEN status = 'OVERDUE' OR (status = 'ISSUED' AND due_date < CURRENT_DATE) THEN 1 END) as total_overdue
       FROM transactions
       ${transDateClause}`,
      transParams
    );

    const [fineStats] = await query(
      `SELECT 
        COALESCE(SUM(amount), 0) as total_fines,
        COALESCE(SUM(CASE WHEN status = 'PAID' THEN amount ELSE 0 END), 0) as paid_fines,
        COALESCE(SUM(CASE WHEN status = 'PENDING' THEN amount ELSE 0 END), 0) as pending_fines
       FROM fines`
    );

    // 2. Most borrowed books
    const [mostBorrowed] = await query(
      `SELECT b.id, b.title, b.isbn, b.author, c.name as category_name, COUNT(t.id) as borrow_count
       FROM books b
       LEFT JOIN categories c ON b.category_id = c.id
       JOIN transactions t ON b.id = t.book_id
       ${transDateClause ? `WHERE t.issue_date >= ? AND t.issue_date <= ?` : ''}
       GROUP BY b.id
       ORDER BY borrow_count DESC
       LIMIT 10`,
      transParams.length === 2 ? transParams : []
    );

    // 3. Most active students
    const [mostActiveStudents] = await query(
      `SELECT u.id, u.name, u.email, COUNT(t.id) as total_borrows,
        COUNT(CASE WHEN t.status IN ('ISSUED', 'OVERDUE') THEN 1 END) as currently_holding
       FROM users u
       JOIN transactions t ON u.id = t.user_id
       WHERE u.role = 'STUDENT'
       GROUP BY u.id
       ORDER BY total_borrows DESC
       LIMIT 10`
    );

    // 4. Books by Category
    const [categoryDistribution] = await query(
      `SELECT c.id, c.name, COUNT(b.id) as book_count, COALESCE(SUM(b.total_copies), 0) as total_copies
       FROM categories c
       LEFT JOIN books b ON c.id = b.category_id
       GROUP BY c.id
       ORDER BY book_count DESC`
    );

    res.status(200).json({
      success: true,
      report: {
        summary: {
          totalBooks: bookCount[0].count || 0,
          totalCopies: bookCount[0].copies || 0,
          totalStudents: studentCount[0].count || 0,
          totalTransactions: transStats[0].total_transactions || 0,
          totalIssued: transStats[0].total_issued || 0,
          totalReturned: transStats[0].total_returned || 0,
          totalOverdue: transStats[0].total_overdue || 0,
          totalFines: parseFloat(fineStats[0].total_fines) || 0,
          paidFines: parseFloat(fineStats[0].paid_fines) || 0,
          pendingFines: parseFloat(fineStats[0].pending_fines) || 0
        },
        mostBorrowed,
        mostActiveStudents,
        categoryDistribution
      }
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/reports/export
const exportTransactions = async (req, res, next) => {
  try {
    const [transactions] = await query(
      `SELECT 
        t.id as Transaction_ID,
        u.name as Student_Name,
        u.email as Student_Email,
        b.title as Book_Title,
        b.isbn as ISBN,
        t.issue_date as Issue_Date,
        t.due_date as Due_Date,
        t.return_date as Return_Date,
        t.status as Status,
        t.fine_amount as Fine_Amount
       FROM transactions t
       JOIN users u ON t.user_id = u.id
       JOIN books b ON t.book_id = b.id
       ORDER BY t.created_at DESC`
    );

    res.status(200).json({
      success: true,
      data: transactions
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getReports,
  exportTransactions
};
