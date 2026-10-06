const express = require('express');
const router = express.Router();
const settingsController = require('../controllers/settingsController');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

router.get('/', settingsController.getSettings);
router.put('/', authenticateToken, requireAdmin, settingsController.updateSettings);

module.exports = router;
