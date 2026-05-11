const express = require('express');
const router = express.Router();
const paymentController = require('../../controllers/payments/paymentController');
const { protect } = require('../../middleware/auth/authenticate');

// POST /api/v1/payments/initialize/:orderId  — start a payment (gateway in body)
router.post('/initialize/:orderId', protect, paymentController.startPayment);

// GET  /api/v1/payments/verify/:orderId      — poll / confirm payment result
router.get('/verify/:orderId', protect, paymentController.verifyPayment);

// GET  /api/v1/payments/status/:orderId      — lightweight status check
router.get('/status/:orderId', protect, paymentController.getPaymentStatus);

// POST /api/v1/payments/cancel/:orderId      — cancel a pending payment
router.post('/cancel/:orderId', protect, paymentController.cancelPayment);

module.exports = router;
