const { query } = require('../config/db');
const { createNotification } = require('../services/notificationService');

// GET /api/fines
const getAllFines = async (req, res, next) => {
  try {
    const { status = 'all', search = '', page = 1, limit = 20 } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10)));
    const offset = (pageNum - 1) * limitNum;

    let whereClauses = [];
    let params = [];

    // Students only see their own fines
    if (req.user.role === 'STUDENT') {
      whereClauses.push('f.user_id = ?');
      params.push(req.user.id);
    }

    if (status && status !== 'all') {
      whereClauses.push('f.status = ?');
      params.push(status);
    }

    if (search.trim()) {
      whereClauses.push('(u.name LIKE ? OR u.email LIKE ? OR b.title LIKE ? OR b.isbn LIKE ?)');
      const term = `%${search.trim()}%`;
      params.push(term, term, term, term);
    }

    const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    const [countRows] = await query(
      `SELECT COUNT(*) as total 
       FROM fines f
       JOIN users u ON f.user_id = u.id
       JOIN transactions t ON f.transaction_id = t.id
       JOIN books b ON t.book_id = b.id
       ${whereSql}`,
      params
    );
    const total = countRows[0].total;

    const [fines] = await query(
      `SELECT 
        f.id, f.transaction_id, f.user_id, f.amount, f.reason, f.status, f.paid_at, f.created_at,
        u.name as student_name, u.email as student_email, u.phone as student_phone,
        b.title as book_title, b.isbn,
        t.issue_date, t.due_date, t.return_date
       FROM fines f
       JOIN users u ON f.user_id = u.id
       JOIN transactions t ON f.transaction_id = t.id
       JOIN books b ON t.book_id = b.id
       ${whereSql}
       ORDER BY f.status ASC, f.created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, limitNum, offset]
    );

    res.status(200).json({
      success: true,
      fines,
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

// PUT /api/fines/:id/pay
const payFine = async (req, res, next) => {
  try {
    const { id } = req.params;

    const [fines] = await query(
      `SELECT f.*, u.name as student_name, b.title as book_title
       FROM fines f
       JOIN users u ON f.user_id = u.id
       JOIN transactions t ON f.transaction_id = t.id
       JOIN books b ON t.book_id = b.id
       WHERE f.id = ?`,
      [id]
    );

    if (fines.length === 0) {
      return res.status(404).json({ success: false, message: 'Fine record not found' });
    }

    const fine = fines[0];

    if (fine.status === 'PAID') {
      return res.status(400).json({
        success: false,
        message: 'This fine has already been marked as paid'
      });
    }

    await query('UPDATE fines SET status = "PAID", paid_at = NOW() WHERE id = ?', [id]);

    // Send receipt notification
    await createNotification(
      fine.user_id,
      'Fine Payment Acknowledged',
      `Payment of ₹${parseFloat(fine.amount).toFixed(2)} for "${fine.book_title}" has been recorded by the library desk.`,
      'SUCCESS'
    );

    res.status(200).json({
      success: true,
      message: `Fine of ₹${parseFloat(fine.amount).toFixed(2)} marked as PAID for ${fine.student_name}`
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/fines/stats
const getFineStats = async (req, res, next) => {
  try {
    const [pendingRows] = await query('SELECT COALESCE(SUM(amount), 0) as total FROM fines WHERE status = "PENDING"');
    const [paidRows] = await query('SELECT COALESCE(SUM(amount), 0) as total FROM fines WHERE status = "PAID"');
    const [overdueRows] = await query(`SELECT COUNT(*) as count FROM transactions WHERE status = 'OVERDUE' OR (status = 'ISSUED' AND due_date < CURRENT_DATE)`);

    res.status(200).json({
      success: true,
      stats: {
        totalPendingFines: parseFloat(pendingRows[0].total) || 0,
        totalCollectedFines: parseFloat(paidRows[0].total) || 0,
        totalOverdueTransactions: overdueRows[0].count || 0
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllFines,
  payFine,
  getFineStats
};
