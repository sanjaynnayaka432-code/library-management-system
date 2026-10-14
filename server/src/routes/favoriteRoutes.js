const express = require('express');
const router = express.Router();
const favoriteController = require('../controllers/favoriteController');
const { authenticateToken } = require('../middleware/auth');

router.use(authenticateToken);

router.get('/', favoriteController.getFavorites);
router.post('/', favoriteController.toggleFavorite);
router.post('/:bookId', favoriteController.toggleFavorite);
router.delete('/:bookId', favoriteController.removeFavorite);
router.get('/check/:bookId', favoriteController.checkFavorite);

module.exports = router;
