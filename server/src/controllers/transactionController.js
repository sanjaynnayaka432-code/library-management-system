const { query } = require('../config/db');
const { getSetting, calculateFine } = require('../utils/fineCalculator');
const { createNotification } = require('../services/notificationService');

// POST /api/transactions/issue
const issueBook = async (req, res, next) => {
  try {
    const { userId, bookId, customDueDate } = req.body;

    if (!userId || !bookId) {
      return res.status(400).json({
        success: false,
        message: 'Both student and book must be selected'
      });
    }

    // 1. Check student exists and is ACTIVE
    const [students] = await query('SELECT id, name, email, status FROM users WHERE id = ?', [userId]);
    if (students.length === 0) {
      return res.status(404).json({ success: false, message: 'Student account not found' });
    }
    const student = students[0];
    if (student.status !== 'ACTIVE') {
      return res.status(400).json({
        success: false,
        message: `Student "${student.name}" account is inactive or disabled`
      });
    }

    // 2. Check student's borrowing limit
    const maxBooksStr = await getSetting('max_books_per_student', '5');
    const maxBooks = parseInt(maxBooksStr, 10) || 5;

    const [activeLoans] = await query(
      `SELECT COUNT(*) as count FROM transactions WHERE user_id = ? AND status IN ('ISSUED', 'OVERDUE')`,
      [userId]
    );

    if (activeLoans[0].count >= maxBooks) {
      return res.status(400).json({
        success: false,
        message: `Student has reached the maximum borrowing limit of ${maxBooks} books`
      });
    }

    // 3. Check student doesn't already have the SAME book currently borrowed
    const [alreadyBorrowed] = await query(
      `SELECT id FROM transactions WHERE user_id = ? AND book_id = ? AND status IN ('ISSUED', 'OVERDUE')`,
      [userId, bookId]
    );

    if (alreadyBorrowed.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Student already has an active copy of this book on loan`
      });
    }

    // 4. Check book exists and has available copies
    const [books] = await query('SELECT id, title, available_copies FROM books WHERE id = ?', [bookId]);
    if (books.length === 0) {
      return res.status(404).json({ success: false, message: 'Book not found' });
    }
    const book = books[0];

    if (book.available_copies <= 0) {
      return res.status(400).json({
        success: false,
        message: `No copies of "${book.title}" are currently available for issue`
      });
    }

    // 5. Determine due date (custom or default from settings)
    let dueDateObj;
    if (customDueDate) {
      dueDateObj = new Date(customDueDate);
    } else {
      const periodStr = await getSetting('borrowing_period_days', '14');
      const periodDays = parseInt(periodStr, 10) || 14;
      dueDateObj = new Date();
      dueDateObj.setDate(dueDateObj.getDate() + periodDays);
    }
    const dueDateFormatted = dueDateObj.toISOString().split('T')[0];
    const todayFormatted = new Date().toISOString().split('T')[0];

    // 6. Create transaction
    const [transResult] = await query(
      `INSERT INTO transactions (user_id, book_id, issue_date, due_date, status, fine_amount, created_at)
       VALUES (?, ?, ?, ?, 'ISSUED', 0.00, NOW())`,
      [userId, bookId, todayFormatted, dueDateFormatted]
    );

    // 7. Decrement available copies
    await query('UPDATE books SET available_copies = available_copies - 1, updated_at = NOW() WHERE id = ?', [bookId]);

    // 8. If student had an active WAITING reservation for this book, mark it FULFILLED
    await query(
      `UPDATE reservations SET status = 'FULFILLED' 
       WHERE user_id = ? AND book_id = ? AND status = 'WAITING'`,
      [userId, bookId]
    );

    // 9. Send notification to student
    await createNotification(
      userId,
      'Book Issued Successfully',
      `You have borrowed "${book.title}". Please return it by ${dueDateFormatted} to avoid overdue fines.`,
      'INFO'
    );

    res.status(201).json({
      success: true,
      message: `Book "${book.title}" issued to ${student.name} successfully`,
      transactionId: transResult.insertId,
      dueDate: dueDateFormatted
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/transactions/return
const returnBook = async (req, res, next) => {
  try {
    const { transactionId, returnDate } = req.body;

    if (!transactionId) {
      return res.status(400).json({
        success: false,
        message: 'Transaction ID is required'
      });
    }

    const [transactions] = await query(
      `SELECT t.*, b.title as book_title, b.id as book_id, u.id as student_id, u.name as student_name
       FROM transactions t
       JOIN books b ON t.book_id = b.id
       JOIN users u ON t.user_id = u.id
       WHERE t.id = ?`,
      [transactionId]
    );

    if (transactions.length === 0) {
      return res.status(404).json({ success: false, message: 'Transaction not found' });
    }

    const trans = transactions[0];
    if (trans.status === 'RETURNED') {
      return res.status(400).json({
        success: false,
        message: 'This book has already been marked as returned'
      });
    }

    const retDate = returnDate ? new Date(returnDate) : new Date();
    const retDateFormatted = retDate.toISOString().split('T')[0];

    // Calculate fine if overdue
    const fineCalculation = await calculateFine(trans.due_date, retDate);
    const fineAmount = fineCalculation.amount;

    // 1. Update transaction
    await query(
      `UPDATE transactions 
       SET return_date = ?, status = 'RETURNED', fine_amount = ?, updated_at = NOW()
       WHERE id = ?`,
      [retDateFormatted, fineAmount, transactionId]
    );

    // 2. Increment book available copies
    await query('UPDATE books SET available_copies = available_copies + 1, updated_at = NOW() WHERE id = ?', [trans.book_id]);

    // 3. Create fine record if late
    let fineRecordId = null;
    if (fineAmount > 0) {
      const [fineRes] = await query(
        `INSERT INTO fines (transaction_id, user_id, amount, reason, status, created_at)
         VALUES (?, ?, ?, ?, 'PENDING', NOW())`,
        [
          transactionId, 
          trans.user_id, 
          fineAmount, 
          `Returned ${fineCalculation.lateDays} day(s) late (Rate: ₹${fineCalculation.fineRate}/day)`
        ]
      );
      fineRecordId = fineRes.insertId;

      await createNotification(
        trans.user_id,
        'Book Returned - Overdue Fine Notice',
        `You returned "${trans.book_title}" ${fineCalculation.lateDays} day(s) late. A pending fine of ₹${fineAmount.toFixed(2)} has been recorded.`,
        'WARNING'
      );
    } else {
      await createNotification(
        trans.user_id,
        'Book Returned On Time',
        `Thank you for returning "${trans.book_title}" on time! No fines applied.`,
        'SUCCESS'
      );
    }

    // 4. Reservation Queue Check: Notify next waiting student
    const [nextReservations] = await query(
      `SELECT r.id, r.user_id, u.name, u.email 
       FROM reservations r
       JOIN users u ON r.user_id = u.id
       WHERE r.book_id = ? AND r.status = 'WAITING'
       ORDER BY r.reservation_date ASC
       LIMIT 1`,
      [trans.book_id]
    );

    let reservationNotified = null;
    if (nextReservations.length > 0) {
      const nextRes = nextReservations[0];
      await createNotification(
        nextRes.user_id,
        'Reserved Book Now Available!',
        `Good news! The book "${trans.book_title}" that you reserved is now returned and available for checkout at the library desk.`,
        'SUCCESS'
      );
      reservationNotified = {
        studentId: nextRes.user_id,
        studentName: nextRes.name
      };
    }

    res.status(200).json({
      success: true,
      message: `Book "${trans.book_title}" successfully returned`,
      fine: {
        isOverdue: fineCalculation.isOverdue,
        lateDays: fineCalculation.lateDays,
        amount: fineAmount,
        fineId: fineRecordId
      },
      reservationNotified
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/transactions
const getAllTransactions = async (req, res, next) => {
  try {
    const { 
      status = 'all', 
      search = '', 
      userId = '', 
      bookId = '', 
      page = 1, 
      limit = 15 
    } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10)));
    const offset = (pageNum - 1) * limitNum;

    let whereClauses = [];
    let params = [];

    // If requester is a student, restrict to their own transactions
    if (req.user && req.user.role === 'STUDENT') {
      whereClauses.push('t.user_id = ?');
      params.push(req.user.id);
    } else if (userId) {
      whereClauses.push('t.user_id = ?');
      params.push(parseInt(userId, 10));
    }

    if (bookId) {
      whereClauses.push('t.book_id = ?');
      params.push(parseInt(bookId, 10));
    }

    if (status && status !== 'all') {
      if (status === 'OVERDUE') {
        whereClauses.push("(t.status = 'OVERDUE' OR (t.status = 'ISSUED' AND t.due_date < CURRENT_DATE))");
      } else {
        whereClauses.push('t.status = ?');
        params.push(status);
      }
    }

    if (search.trim()) {
      whereClauses.push('(u.name LIKE ? OR u.email LIKE ? OR b.title LIKE ? OR b.isbn LIKE ?)');
      const term = `%${search.trim()}%`;
      params.push(term, term, term, term);
    }

    const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    const [countRows] = await query(
      `SELECT COUNT(*) as total 
       FROM transactions t
       JOIN users u ON t.user_id = u.id
       JOIN books b ON t.book_id = b.id
       ${whereSql}`,
      params
    );
    const total = countRows[0].total;

    const [transactions] = await query(
      `SELECT 
        t.id, t.user_id, t.book_id, t.issue_date, t.due_date, t.return_date, 
        t.status, t.fine_amount, t.created_at,
        u.name as student_name, u.email as student_email, u.phone as student_phone,
        b.title as book_title, b.isbn, b.cover_image, b.shelf_location,
        DATEDIFF(CURRENT_DATE, t.due_date) as days_overdue,
        DATEDIFF(t.due_date, CURRENT_DATE) as days_remaining
       FROM transactions t
       JOIN users u ON t.user_id = u.id
       JOIN books b ON t.book_id = b.id
       ${whereSql}
       ORDER BY t.created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, limitNum, offset]
    );

    res.status(200).json({
      success: true,
      transactions,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum) || 1
      }
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/transactions/:id
const getTransactionById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const [transactions] = await query(
      `SELECT 
        t.*,
        u.name as student_name, u.email as student_email, u.phone as student_phone,
        b.title as book_title, b.isbn, b.author, b.cover_image, b.shelf_location,
        f.id as fine_id, f.amount as fine_record_amount, f.status as fine_status
       FROM transactions t
       JOIN users u ON t.user_id = u.id
       JOIN books b ON t.book_id = b.id
       LEFT JOIN fines f ON t.id = f.transaction_id
       WHERE t.id = ?`,
      [id]
    );

    if (transactions.length === 0) {
      return res.status(404).json({ success: false, message: 'Transaction not found' });
    }

    // Role check: student can only view their own transaction
    if (req.user.role === 'STUDENT' && transactions[0].user_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    res.status(200).json({
      success: true,
      transaction: transactions[0]
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  issueBook,
  returnBook,
  getAllTransactions,
  getTransactionById
};
