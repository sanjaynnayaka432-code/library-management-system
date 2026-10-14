const { query } = require('../config/db');

// Helper to recalculate and update book's rating average and count
const updateBookRatingStats = async (bookId) => {
  try {
    const [stats] = await query(
      `SELECT COUNT(*) as count, AVG(rating) as avg_rating 
       FROM reviews 
       WHERE book_id = ? AND status = 'APPROVED'`,
      [bookId]
    );

    const count = stats[0].count || 0;
    const avg = count > 0 ? parseFloat(Number(stats[0].avg_rating).toFixed(2)) : 4.50;

    await query(
      'UPDATE books SET rating_avg = ?, rating_count = ? WHERE id = ?',
      [avg, count, bookId]
    );
  } catch (err) {
    console.error('Failed to update book rating stats:', err.message);
  }
};

// GET /api/books/:bookId/reviews or /api/reviews?bookId=...
const getBookReviews = async (req, res, next) => {
  try {
    const bookId = req.params.bookId || req.query.bookId;

    if (!bookId) {
      return res.status(400).json({ success: false, message: 'Book ID is required' });
    }

    const [reviews] = await query(
      `SELECT 
        r.id, r.user_id, r.book_id, r.rating, r.review_text, r.status, r.created_at,
        u.name as user_name, u.email as user_email, u.role as user_role
       FROM reviews r
       JOIN users u ON r.user_id = u.id
       WHERE r.book_id = ? AND r.status = 'APPROVED'
       ORDER BY r.created_at DESC`,
      [bookId]
    );

    const [stats] = await query(
      `SELECT COUNT(*) as count, AVG(rating) as avg_rating 
       FROM reviews 
       WHERE book_id = ? AND status = 'APPROVED'`,
      [bookId]
    );

    res.status(200).json({
      success: true,
      reviews,
      stats: {
        totalReviews: stats[0].count || 0,
        averageRating: stats[0].count > 0 ? parseFloat(Number(stats[0].avg_rating).toFixed(1)) : 4.5
      }
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/books/:bookId/reviews
const addReview = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const bookId = req.params.bookId || req.body.bookId;
    const { rating, review_text, reviewText } = req.body;

    const ratingVal = parseInt(rating, 10);
    if (isNaN(ratingVal) || ratingVal < 1 || ratingVal > 5) {
      return res.status(400).json({
        success: false,
        message: 'Rating must be an integer between 1 and 5 stars'
      });
    }

    const text = (review_text || reviewText || '').trim();

    // Check if user already reviewed this book (one review per user per book)
    const [existing] = await query(
      'SELECT id FROM reviews WHERE user_id = ? AND book_id = ?',
      [userId, bookId]
    );

    if (existing.length > 0) {
      await query(
        `UPDATE reviews 
         SET rating = ?, review_text = ?, status = 'APPROVED', updated_at = NOW() 
         WHERE id = ?`,
        [ratingVal, text, existing[0].id]
      );
    } else {
      await query(
        `INSERT INTO reviews (user_id, book_id, rating, review_text, status, created_at)
         VALUES (?, ?, ?, ?, 'APPROVED', NOW())`,
        [userId, bookId, ratingVal, text]
      );
    }

    await updateBookRatingStats(bookId);

    res.status(201).json({
      success: true,
      message: 'Review submitted successfully!'
    });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/reviews/:id - author or admin can delete review
const deleteReview = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const isAdmin = req.user.role === 'ADMIN';

    const [reviews] = await query('SELECT * FROM reviews WHERE id = ?', [id]);
    if (reviews.length === 0) {
      return res.status(404).json({ success: false, message: 'Review not found' });
    }

    const review = reviews[0];
    if (!isAdmin && review.user_id !== userId) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to delete this review'
      });
    }

    await query('DELETE FROM reviews WHERE id = ?', [id]);
    await updateBookRatingStats(review.book_id);

    res.status(200).json({
      success: true,
      message: 'Review deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/reviews/all (Admin moderation view)
const getAllReviewsAdmin = async (req, res, next) => {
  try {
    const [reviews] = await query(
      `SELECT 
        r.id, r.rating, r.review_text, r.status, r.created_at,
        u.name as user_name, u.email as user_email,
        b.id as book_id, b.title as book_title
       FROM reviews r
       JOIN users u ON r.user_id = u.id
       JOIN books b ON r.book_id = b.id
       ORDER BY r.created_at DESC
       LIMIT 100`
    );

    res.status(200).json({
      success: true,
      reviews
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getBookReviews,
  addReview,
  deleteReview,
  getAllReviewsAdmin
};
