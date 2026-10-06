const express = require('express');
const router = express.Router();
const reservationController = require('../controllers/reservationController');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

router.use(authenticateToken);

router.post('/', reservationController.createReservation);
router.get('/', reservationController.getAllReservations);
router.put('/:id', reservationController.updateReservationStatus);
router.delete('/:id', reservationController.deleteReservation);

module.exports = router;
