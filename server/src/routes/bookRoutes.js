const express = require('express');
const router = express.Router();
const bookController = require('../controllers/bookController');
const reviewController = require('../controllers/reviewController');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

// Public / Authenticated read routes
router.get('/discovery', bookController.getDiscoverySections);
router.get('/catalog-stats', bookController.getCatalogStats);
router.get('/', bookController.getAllBooks);
router.get('/:id', bookController.getBookById);
router.get('/:id/qrcode', bookController.getBookQrCode);

// Book Reviews
router.get('/:id/reviews', reviewController.getBookReviews);
router.post('/:id/reviews', authenticateToken, reviewController.addReview);

// Admin-only management routes
router.post('/bulk', authenticateToken, requireAdmin, bookController.bulkCreateBooks);
router.post('/', authenticateToken, requireAdmin, bookController.createBook);
router.put('/:id', authenticateToken, requireAdmin, bookController.updateBook);
router.delete('/:id', authenticateToken, requireAdmin, bookController.deleteBook);

module.exports = router;
