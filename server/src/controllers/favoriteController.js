const { query } = require('../config/db');

// GET /api/favorites - Get current student's favorite books
const getFavorites = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 20 } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10)));
    const offset = (pageNum - 1) * limitNum;

    const [countRows] = await query(
      'SELECT COUNT(*) as total FROM favorites WHERE user_id = ?',
      [userId]
    );
    const total = countRows[0].total;

    const [books] = await query(
      `SELECT 
        b.id, b.title, b.isbn, b.author, b.publisher, b.publication_year, 
        b.category_id, c.name as category_name, b.description, b.cover_image, 
        b.total_copies, b.available_copies, b.shelf_location, b.language, b.book_format,
        b.pages, b.rating_avg, b.rating_count, f.created_at as favorited_at,
        1 as is_favorite
       FROM favorites f
       JOIN books b ON f.book_id = b.id
       LEFT JOIN categories c ON b.category_id = c.id
       WHERE f.user_id = ?
       ORDER BY f.created_at DESC
       LIMIT ? OFFSET ?`,
      [userId, limitNum, offset]
    );

    res.status(200).json({
      success: true,
      favorites: books,
      books, // for convenience
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

// POST /api/favorites/:bookId or POST /api/favorites - Toggle or Add favorite
const toggleFavorite = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const bookId = req.params.bookId || req.body.bookId;

    if (!bookId) {
      return res.status(400).json({ success: false, message: 'Book ID is required' });
    }

    const [existing] = await query(
      'SELECT id FROM favorites WHERE user_id = ? AND book_id = ?',
      [userId, bookId]
    );

    if (existing.length > 0) {
      // Remove
      await query('DELETE FROM favorites WHERE id = ?', [existing[0].id]);
      return res.status(200).json({
        success: true,
        isFavorite: false,
        message: 'Removed from favorites'
      });
    } else {
      // Add
      await query('INSERT INTO favorites (user_id, book_id, created_at) VALUES (?, ?, NOW())', [
        userId,
        bookId
      ]);
      return res.status(201).json({
        success: true,
        isFavorite: true,
        message: 'Added to favorites'
      });
    }
  } catch (error) {
    next(error);
  }
};

// DELETE /api/favorites/:bookId
const removeFavorite = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { bookId } = req.params;

    await query('DELETE FROM favorites WHERE user_id = ? AND book_id = ?', [userId, bookId]);

    res.status(200).json({
      success: true,
      isFavorite: false,
      message: 'Removed from favorites'
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/favorites/check/:bookId
const checkFavorite = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { bookId } = req.params;

    const [rows] = await query(
      'SELECT id FROM favorites WHERE user_id = ? AND book_id = ?',
      [userId, bookId]
    );

    res.status(200).json({
      success: true,
      isFavorite: rows.length > 0
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getFavorites,
  toggleFavorite,
  removeFavorite,
  checkFavorite
};
