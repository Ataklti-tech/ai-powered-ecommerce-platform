const express = require('express');
const router = express.Router();
const webhookController = require('../../controllers/payments/paymentWebhookController');

// Stripe requires the raw (unparsed) body for signature verification,
// so apply express.raw() locally on this route only.
// POST /api/webhooks/stripe
router.post(
  '/stripe',
  express.raw({ type: 'application/json' }),
  webhookController.handleStripeWebhook
);

// POST /api/webhooks/paypal
router.post('/paypal', webhookController.handlePaypalWebhook);

// POST /api/webhooks/mtn-momo
router.post('/mtn-momo', webhookController.handleMTNMoMoWebhook);

// POST /api/webhooks/airtel
router.post('/airtel', webhookController.handleAirtelWebhook);

// POST /api/webhooks/pesapal
router.post('/pesapal', webhookController.handlePesapalWebhook);

// POST /api/webhooks/test
router.post('/test', webhookController.handleTestWebhook);

module.exports = router;
