const { query } = require('../config/db');
const { createNotification } = require('../services/notificationService');

// POST /api/reservations
const createReservation = async (req, res, next) => {
  try {
    const { bookId, userId: requestedUserId } = req.body;

    // Student can only reserve for themselves; admin can reserve for any student
    const targetUserId = (req.user.role === 'ADMIN' && requestedUserId) 
      ? requestedUserId 
      : req.user.id;

    if (!bookId) {
      return res.status(400).json({
        success: false,
        message: 'Book ID is required'
      });
    }

    // Check book exists
    const [books] = await query('SELECT id, title, available_copies FROM books WHERE id = ?', [bookId]);
    if (books.length === 0) {
      return res.status(404).json({ success: false, message: 'Book not found' });
    }
    const book = books[0];

    // Check duplicate WAITING reservation
    const [existingRes] = await query(
      `SELECT id FROM reservations WHERE user_id = ? AND book_id = ? AND status = 'WAITING'`,
      [targetUserId, bookId]
    );

    if (existingRes.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'You already have an active reservation for this book'
      });
    }

    // Check if student already has this book checked out
    const [activeLoan] = await query(
      `SELECT id FROM transactions WHERE user_id = ? AND book_id = ? AND status IN ('ISSUED', 'OVERDUE')`,
      [targetUserId, bookId]
    );

    if (activeLoan.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'You currently have this book borrowed. You cannot reserve it simultaneously.'
      });
    }

    // Create reservation
    const [result] = await query(
      `INSERT INTO reservations (user_id, book_id, reservation_date, status, created_at)
       VALUES (?, ?, NOW(), 'WAITING', NOW())`,
      [targetUserId, bookId]
    );

    // Get position in queue
    const [queuePos] = await query(
      `SELECT COUNT(*) as pos FROM reservations WHERE book_id = ? AND status = 'WAITING' AND reservation_date <= NOW()`,
      [bookId]
    );

    // Notify student
    await createNotification(
      targetUserId,
      'Book Reservation Confirmed',
      `You have reserved "${book.title}". Your queue position is #${queuePos[0].pos || 1}. We will notify you when a copy becomes available!`,
      'SUCCESS'
    );

    res.status(201).json({
      success: true,
      message: `Reservation confirmed for "${book.title}" (Queue position: #${queuePos[0].pos || 1})`,
      reservationId: result.insertId,
      queuePosition: queuePos[0].pos || 1
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/reservations
const getAllReservations = async (req, res, next) => {
  try {
    const { status = 'all', search = '', page = 1, limit = 20 } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10)));
    const offset = (pageNum - 1) * limitNum;

    let whereClauses = [];
    let params = [];

    // Filter by student if not admin
    if (req.user.role === 'STUDENT') {
      whereClauses.push('r.user_id = ?');
      params.push(req.user.id);
    }

    if (status && status !== 'all') {
      whereClauses.push('r.status = ?');
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
       FROM reservations r
       JOIN users u ON r.user_id = u.id
       JOIN books b ON r.book_id = b.id
       ${whereSql}`,
      params
    );
    const total = countRows[0].total;

    const [reservations] = await query(
      `SELECT 
        r.id, r.user_id, r.book_id, r.reservation_date, r.status, r.created_at,
        u.name as student_name, u.email as student_email, u.phone as student_phone,
        b.title as book_title, b.isbn, b.cover_image, b.available_copies, b.shelf_location
       FROM reservations r
       JOIN users u ON r.user_id = u.id
       JOIN books b ON r.book_id = b.id
       ${whereSql}
       ORDER BY r.reservation_date DESC
       LIMIT ? OFFSET ?`,
      [...params, limitNum, offset]
    );

    res.status(200).json({
      success: true,
      reservations,
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

// PUT /api/reservations/:id
const updateReservationStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['WAITING', 'FULFILLED', 'CANCELLED'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid reservation status. Must be WAITING, FULFILLED, or CANCELLED'
      });
    }

    const [reservations] = await query(
      `SELECT r.*, b.title as book_title FROM reservations r JOIN books b ON r.book_id = b.id WHERE r.id = ?`,
      [id]
    );

    if (reservations.length === 0) {
      return res.status(404).json({ success: false, message: 'Reservation not found' });
    }

    const resItem = reservations[0];

    // Student can only cancel their own reservation
    if (req.user.role === 'STUDENT') {
      if (resItem.user_id !== req.user.id) {
        return res.status(403).json({ success: false, message: 'Access denied' });
      }
      if (status !== 'CANCELLED') {
        return res.status(403).json({ success: false, message: 'Students can only cancel reservations' });
      }
    }

    await query('UPDATE reservations SET status = ? WHERE id = ?', [status, id]);

    if (status === 'FULFILLED') {
      await createNotification(
        resItem.user_id,
        'Reservation Fulfilled',
        `Your reservation for "${resItem.book_title}" has been fulfilled!`,
        'SUCCESS'
      );
    } else if (status === 'CANCELLED') {
      await createNotification(
        resItem.user_id,
        'Reservation Cancelled',
        `Your reservation for "${resItem.book_title}" has been cancelled.`,
        'INFO'
      );
    }

    res.status(200).json({
      success: true,
      message: `Reservation status updated to ${status}`
    });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/reservations/:id
const deleteReservation = async (req, res, next) => {
  try {
    const { id } = req.params;

    const [existing] = await query('SELECT * FROM reservations WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Reservation not found' });
    }

    if (req.user.role === 'STUDENT' && existing[0].user_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    await query('DELETE FROM reservations WHERE id = ?', [id]);

    res.status(200).json({
      success: true,
      message: 'Reservation cancelled successfully'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createReservation,
  getAllReservations,
  updateReservationStatus,
  deleteReservation
};
