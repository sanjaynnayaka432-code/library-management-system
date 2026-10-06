const QRCode = require('qrcode');
const { query } = require('../config/db');

// GET /api/books
const getAllBooks = async (req, res, next) => {
  try {
    const { 
      search = '', 
      category = '', 
      availability = 'all', 
      sortBy = 'newest',
      page = 1, 
      limit = 12 
    } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10)));
    const offset = (pageNum - 1) * limitNum;

    let whereClauses = [];
    let params = [];

    if (search.trim()) {
      whereClauses.push('(b.title LIKE ? OR b.author LIKE ? OR b.isbn LIKE ?)');
      const searchTerm = `%${search.trim()}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    if (category && category !== 'all') {
      whereClauses.push('b.category_id = ?');
      params.push(parseInt(category, 10));
    }

    if (availability === 'available') {
      whereClauses.push('b.available_copies > 0');
    } else if (availability === 'unavailable') {
      whereClauses.push('b.available_copies <= 0');
    }

    const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    let orderSql = 'ORDER BY b.created_at DESC';
    if (sortBy === 'title_asc') orderSql = 'ORDER BY b.title ASC';
    else if (sortBy === 'title_desc') orderSql = 'ORDER BY b.title DESC';
    else if (sortBy === 'year_desc') orderSql = 'ORDER BY b.publication_year DESC';
    else if (sortBy === 'most_borrowed') {
      orderSql = 'ORDER BY borrow_count DESC, b.created_at DESC';
    }

    // Count total query
    const [countRows] = await query(
      `SELECT COUNT(*) as total 
       FROM books b 
       ${whereSql}`,
      params
    );
    const total = countRows[0].total;

    // Data query with borrow count
    const [books] = await query(
      `SELECT 
        b.id, b.title, b.isbn, b.author, b.publisher, b.publication_year, 
        b.category_id, c.name as category_name, b.description, b.cover_image, 
        b.total_copies, b.available_copies, b.shelf_location, b.created_at, b.updated_at,
        COUNT(t.id) as borrow_count
       FROM books b
       LEFT JOIN categories c ON b.category_id = c.id
       LEFT JOIN transactions t ON b.id = t.book_id
       ${whereSql}
       GROUP BY b.id, c.name
       ${orderSql}
       LIMIT ? OFFSET ?`,
      [...params, limitNum, offset]
    );

    res.status(200).json({
      success: true,
      books,
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

// GET /api/books/:id
const getBookById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const [books] = await query(
      `SELECT 
        b.*, c.name as category_name,
        (SELECT COUNT(*) FROM reservations WHERE book_id = b.id AND status = 'WAITING') as waiting_reservations_count,
        (SELECT COUNT(*) FROM transactions WHERE book_id = b.id AND status = 'ISSUED') as active_borrowed_count
       FROM books b
       LEFT JOIN categories c ON b.category_id = c.id
       WHERE b.id = ?`,
      [id]
    );

    if (books.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Book not found'
      });
    }

    const book = books[0];

    // Generate QR code data URL (encodes book info and link)
    const qrData = JSON.stringify({
      id: book.id,
      title: book.title,
      isbn: book.isbn,
      shelf: book.shelf_location
    });
    const qrCodeUrl = await QRCode.toDataURL(qrData, {
      width: 256,
      margin: 2,
      color: {
        dark: '#1e293b',
        light: '#ffffff'
      }
    });

    res.status(200).json({
      success: true,
      book: {
        ...book,
        qrCodeUrl
      }
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/books
const createBook = async (req, res, next) => {
  try {
    const {
      title,
      isbn,
      author,
      publisher,
      publication_year,
      category_id,
      description,
      cover_image,
      total_copies,
      shelf_location
    } = req.body;

    if (!title || !isbn || !author || !category_id || total_copies === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Title, ISBN, Author, Category, and Total Copies are required'
      });
    }

    const copies = parseInt(total_copies, 10);
    if (isNaN(copies) || copies < 1) {
      return res.status(400).json({
        success: false,
        message: 'Total copies must be a positive integer'
      });
    }

    // Check ISBN uniqueness
    const [existingIsbn] = await query('SELECT id FROM books WHERE isbn = ?', [isbn.trim()]);
    if (existingIsbn.length > 0) {
      return res.status(409).json({
        success: false,
        message: `A book with ISBN "${isbn.trim()}" already exists`
      });
    }

    // Check category exists
    const [category] = await query('SELECT id FROM categories WHERE id = ?', [category_id]);
    if (category.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Selected category does not exist'
      });
    }

    const [result] = await query(
      `INSERT INTO books 
       (title, isbn, author, publisher, publication_year, category_id, description, cover_image, total_copies, available_copies, shelf_location, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        title.trim(),
        isbn.trim(),
        author.trim(),
        publisher ? publisher.trim() : null,
        publication_year ? parseInt(publication_year, 10) : null,
        category_id,
        description ? description.trim() : null,
        cover_image ? cover_image.trim() : 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&q=80&w=600',
        copies,
        copies, // Available copies equals total copies initially
        shelf_location ? shelf_location.trim() : 'General Stacks'
      ]
    );

    const [newBook] = await query(
      `SELECT b.*, c.name as category_name 
       FROM books b 
       LEFT JOIN categories c ON b.category_id = c.id 
       WHERE b.id = ?`,
      [result.insertId]
    );

    res.status(201).json({
      success: true,
      message: 'Book created successfully',
      book: newBook[0]
    });
  } catch (error) {
    next(error);
  }
};

// PUT /api/books/:id
const updateBook = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      title,
      isbn,
      author,
      publisher,
      publication_year,
      category_id,
      description,
      cover_image,
      total_copies,
      shelf_location
    } = req.body;

    const [existing] = await query('SELECT * FROM books WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Book not found' });
    }
    const currentBook = existing[0];

    // ISBN duplicate check
    if (isbn && isbn.trim() !== currentBook.isbn) {
      const [duplicate] = await query('SELECT id FROM books WHERE isbn = ? AND id != ?', [isbn.trim(), id]);
      if (duplicate.length > 0) {
        return res.status(409).json({
          success: false,
          message: `Another book already has ISBN "${isbn.trim()}"`
        });
      }
    }

    // Handle copies adjustment
    let newTotal = currentBook.total_copies;
    let newAvailable = currentBook.available_copies;

    if (total_copies !== undefined) {
      const parsedTotal = parseInt(total_copies, 10);
      if (isNaN(parsedTotal) || parsedTotal < 1) {
        return res.status(400).json({
          success: false,
          message: 'Total copies must be at least 1'
        });
      }

      // Check active loans
      const [loanCount] = await query(
        `SELECT COUNT(*) as active_loans FROM transactions WHERE book_id = ? AND status = 'ISSUED'`,
        [id]
      );
      const activeLoans = loanCount[0].active_loans;

      if (parsedTotal < activeLoans) {
        return res.status(400).json({
          success: false,
          message: `Cannot reduce total copies below active loans (${activeLoans} currently issued)`
        });
      }

      const diff = parsedTotal - currentBook.total_copies;
      newTotal = parsedTotal;
      newAvailable = Math.max(0, currentBook.available_copies + diff);
    }

    await query(
      `UPDATE books SET 
        title = COALESCE(?, title),
        isbn = COALESCE(?, isbn),
        author = COALESCE(?, author),
        publisher = COALESCE(?, publisher),
        publication_year = COALESCE(?, publication_year),
        category_id = COALESCE(?, category_id),
        description = COALESCE(?, description),
        cover_image = COALESCE(?, cover_image),
        total_copies = ?,
        available_copies = ?,
        shelf_location = COALESCE(?, shelf_location),
        updated_at = NOW()
       WHERE id = ?`,
      [
        title ? title.trim() : null,
        isbn ? isbn.trim() : null,
        author ? author.trim() : null,
        publisher ? publisher.trim() : null,
        publication_year ? parseInt(publication_year, 10) : null,
        category_id || null,
        description !== undefined ? description : null,
        cover_image || null,
        newTotal,
        newAvailable,
        shelf_location ? shelf_location.trim() : null,
        id
      ]
    );

    const [updated] = await query(
      `SELECT b.*, c.name as category_name 
       FROM books b 
       LEFT JOIN categories c ON b.category_id = c.id 
       WHERE b.id = ?`,
      [id]
    );

    res.status(200).json({
      success: true,
      message: 'Book updated successfully',
      book: updated[0]
    });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/books/:id
const deleteBook = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Check active loans
    const [activeLoans] = await query(
      `SELECT COUNT(*) as count FROM transactions WHERE book_id = ? AND status = 'ISSUED'`,
      [id]
    );

    if (activeLoans[0].count > 0) {
      return res.status(409).json({
        success: false,
        message: `Cannot delete book while there are ${activeLoans[0].count} active issued copy/copies. Please return them first.`
      });
    }

    const [result] = await query('DELETE FROM books WHERE id = ?', [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Book not found' });
    }

    res.status(200).json({
      success: true,
      message: 'Book deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/books/:id/qrcode
const getBookQrCode = async (req, res, next) => {
  try {
    const { id } = req.params;
    const [books] = await query('SELECT id, title, isbn, shelf_location FROM books WHERE id = ?', [id]);
    if (books.length === 0) {
      return res.status(404).json({ success: false, message: 'Book not found' });
    }

    const book = books[0];
    const qrData = JSON.stringify({
      id: book.id,
      title: book.title,
      isbn: book.isbn,
      shelf: book.shelf_location
    });

    const qrDataUrl = await QRCode.toDataURL(qrData, { width: 300, margin: 2 });
    res.status(200).json({
      success: true,
      qrCodeUrl: qrDataUrl,
      qrDataUrl,
      book
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllBooks,
  getBookById,
  createBook,
  updateBook,
  deleteBook,
  getBookQrCode
};
