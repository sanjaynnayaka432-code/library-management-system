const express = require('express');
const router = express.Router();
const fineController = require('../controllers/fineController');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

router.use(authenticateToken);

router.get('/', fineController.getAllFines);
router.get('/stats', requireAdmin, fineController.getFineStats);
router.put('/:id/pay', requireAdmin, fineController.payFine);

module.exports = router;
