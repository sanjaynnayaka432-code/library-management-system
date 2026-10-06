const bcrypt = require('bcryptjs');
const { query } = require('../config/db');

// GET /api/students
const getAllStudents = async (req, res, next) => {
  try {
    const { search = '', status = 'all' } = req.query;

    let whereClauses = ["u.role = 'STUDENT'"];
    let params = [];

    if (search.trim()) {
      whereClauses.push('(u.name LIKE ? OR u.email LIKE ? OR u.phone LIKE ?)');
      const term = `%${search.trim()}%`;
      params.push(term, term, term);
    }

    if (status && status !== 'all') {
      whereClauses.push('u.status = ?');
      params.push(status);
    }

    const whereSql = `WHERE ${whereClauses.join(' AND ')}`;

    const [students] = await query(
      `SELECT 
        u.id, u.name, u.email, u.phone, u.status, u.created_at,
        COUNT(DISTINCT CASE WHEN t.status = 'ISSUED' THEN t.id END) as active_loans_count,
        COUNT(DISTINCT CASE WHEN t.status = 'OVERDUE' THEN t.id END) as overdue_loans_count,
        COALESCE(SUM(CASE WHEN f.status = 'PENDING' THEN f.amount ELSE 0 END), 0) as pending_fines_total
       FROM users u
       LEFT JOIN transactions t ON u.id = t.user_id
       LEFT JOIN fines f ON u.id = f.user_id
       ${whereSql}
       GROUP BY u.id
       ORDER BY u.created_at DESC`,
      params
    );

    res.status(200).json({
      success: true,
      students
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/students/:id
const getStudentById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const [students] = await query(
      `SELECT id, name, email, phone, role, status, profile_image, created_at, updated_at 
       FROM users WHERE id = ? AND role = 'STUDENT'`,
      [id]
    );

    if (students.length === 0) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    const student = students[0];

    // Currently borrowed books
    const [activeLoans] = await query(
      `SELECT 
        t.id as transaction_id, t.issue_date, t.due_date, t.status, t.fine_amount,
        b.id as book_id, b.title, b.isbn, b.cover_image, b.shelf_location,
        DATEDIFF(t.due_date, CURRENT_DATE) as days_remaining
       FROM transactions t
       JOIN books b ON t.book_id = b.id
       WHERE t.user_id = ? AND t.status IN ('ISSUED', 'OVERDUE')
       ORDER BY t.due_date ASC`,
      [id]
    );

    // Borrowing history (returned)
    const [history] = await query(
      `SELECT 
        t.id as transaction_id, t.issue_date, t.due_date, t.return_date, t.status, t.fine_amount,
        b.id as book_id, b.title, b.isbn, b.cover_image
       FROM transactions t
       JOIN books b ON t.book_id = b.id
       WHERE t.user_id = ? AND t.status = 'RETURNED'
       ORDER BY t.return_date DESC`,
      [id]
    );

    // Pending fines
    const [fines] = await query(
      `SELECT f.id, f.amount, f.reason, f.status, f.created_at, b.title as book_title
       FROM fines f
       JOIN transactions t ON f.transaction_id = t.id
       JOIN books b ON t.book_id = b.id
       WHERE f.user_id = ?
       ORDER BY f.created_at DESC`,
      [id]
    );

    res.status(200).json({
      success: true,
      student: {
        ...student,
        activeLoans,
        history,
        fines
      }
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/students
const createStudent = async (req, res, next) => {
  try {
    const { name, email, phone, password } = req.body;

    if (!name || !email) {
      return res.status(400).json({
        success: false,
        message: 'Name and email are required'
      });
    }

    const [existing] = await query('SELECT id FROM users WHERE email = ?', [email.toLowerCase().trim()]);
    if (existing.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email already exists'
      });
    }

    const defaultPassword = password && password.trim().length >= 6 ? password.trim() : 'Student@123';
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(defaultPassword, salt);

    const [result] = await query(
      `INSERT INTO users (name, email, password, phone, role, status, created_at)
       VALUES (?, ?, ?, ?, 'STUDENT', 'ACTIVE', NOW())`,
      [name.trim(), email.toLowerCase().trim(), hashedPassword, phone ? phone.trim() : null]
    );

    const [newStudent] = await query(
      'SELECT id, name, email, phone, role, status, created_at FROM users WHERE id = ?',
      [result.insertId]
    );

    res.status(201).json({
      success: true,
      message: 'Student account created successfully',
      student: newStudent[0],
      defaultPasswordNotice: password ? undefined : 'Default password is set to: Student@123'
    });
  } catch (error) {
    next(error);
  }
};

// PUT /api/students/:id
const updateStudent = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, email, phone, status } = req.body;

    const [existing] = await query('SELECT * FROM users WHERE id = ? AND role = "STUDENT"', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    if (email && email.toLowerCase().trim() !== existing[0].email) {
      const [duplicate] = await query('SELECT id FROM users WHERE email = ? AND id != ?', [email.toLowerCase().trim(), id]);
      if (duplicate.length > 0) {
        return res.status(409).json({ success: false, message: 'Email is already in use by another user' });
      }
    }

    await query(
      `UPDATE users SET
        name = COALESCE(?, name),
        email = COALESCE(?, email),
        phone = COALESCE(?, phone),
        status = COALESCE(?, status),
        updated_at = NOW()
       WHERE id = ?`,
      [
        name ? name.trim() : null,
        email ? email.toLowerCase().trim() : null,
        phone !== undefined ? (phone ? phone.trim() : null) : null,
        status || null,
        id
      ]
    );

    const [updated] = await query(
      'SELECT id, name, email, phone, role, status, created_at FROM users WHERE id = ?',
      [id]
    );

    res.status(200).json({
      success: true,
      message: 'Student updated successfully',
      student: updated[0]
    });
  } catch (error) {
    next(error);
  }
};

// PUT /api/students/:id/toggle-status
const toggleStudentStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const [existing] = await query('SELECT id, status FROM users WHERE id = ? AND role = "STUDENT"', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    const newStatus = existing[0].status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    await query('UPDATE users SET status = ?, updated_at = NOW() WHERE id = ?', [newStatus, id]);

    res.status(200).json({
      success: true,
      message: `Student account marked as ${newStatus}`,
      status: newStatus
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllStudents,
  getStudentById,
  createStudent,
  updateStudent,
  toggleStudentStatus
};
