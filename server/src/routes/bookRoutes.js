const express = require('express');
const router = express.Router();
const bookController = require('../controllers/bookController');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

// Public / Authenticated read routes
router.get('/', bookController.getAllBooks);
router.get('/:id', bookController.getBookById);
router.get('/:id/qrcode', bookController.getBookQrCode);

// Admin-only management routes
router.post('/', authenticateToken, requireAdmin, bookController.createBook);
router.put('/:id', authenticateToken, requireAdmin, bookController.updateBook);
router.delete('/:id', authenticateToken, requireAdmin, bookController.deleteBook);

module.exports = router;
