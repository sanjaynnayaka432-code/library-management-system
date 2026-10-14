const express = require('express');
const router = express.Router();
const transactionController = require('../controllers/transactionController');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

router.use(authenticateToken);

// Student and Admin can view transactions (filtered appropriately)
router.get('/', transactionController.getAllTransactions);
router.get('/:id', transactionController.getTransactionById);

// Student borrow route
router.post('/borrow', transactionController.borrowBook);

// Issue and Return actions require Admin privileges
router.post('/issue', requireAdmin, transactionController.issueBook);
router.post('/return', requireAdmin, transactionController.returnBook);


module.exports = router;
