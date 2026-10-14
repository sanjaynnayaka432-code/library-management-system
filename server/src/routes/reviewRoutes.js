const express = require('express');
const router = express.Router({ mergeParams: true });
const reviewController = require('../controllers/reviewController');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

// Public read
router.get('/', reviewController.getBookReviews);
router.get('/book/:bookId', reviewController.getBookReviews);

// Authenticated write & delete
router.post('/', authenticateToken, reviewController.addReview);
router.post('/book/:bookId', authenticateToken, reviewController.addReview);
router.delete('/:id', authenticateToken, reviewController.deleteReview);

// Admin moderation
router.get('/admin/all', authenticateToken, requireAdmin, reviewController.getAllReviewsAdmin);

module.exports = router;
