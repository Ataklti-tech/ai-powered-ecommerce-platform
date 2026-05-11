const catchAsync = require("../../utils/constants/catchAsync");

let _stripe = null;
const getStripe = () => {
  if (!_stripe) {
    if (!process.env.STRIPE_SECRET_KEY) throw new Error('STRIPE_SECRET_KEY is not configured');
    _stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
  }
  return _stripe;
};

exports.startPayment = catchAsync(async (order, customer) => {
  const stripe = getStripe();
  const paymentIntent = await stripe.paymentIntents.create({
    amount: Math.round(order.totalAmount * 100),
    currency: "usd",
    metadata: {
      orderId: order._id.toString(),
      orderNumber: order.orderNumber,
    },
    receipt_email: customer.email,
    automatic_payment_methods: { enabled: true },
  });

  return {
    gateway: "stripe",
    reference: paymentIntent.id,
    clientSecret: paymentIntent.client_secret,
    amount: order.totalAmount,
  };
});

exports.verifyPayment = catchAsync(async (paymentIntentId) => {
  const stripe = getStripe();
  const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

  return {
    success: paymentIntent.status === "succeeded",
    transactionId: paymentIntent.id,
    amount: paymentIntent.amount_received / 100,
    data: paymentIntent,
  };
});

exports.verifyWebhookSignature = (payload, signature) => {
  return getStripe().webhooks.constructEvent(
    payload,
    signature,
    process.env.STRIPE_WEBHOOK_SECRET
  );
};
