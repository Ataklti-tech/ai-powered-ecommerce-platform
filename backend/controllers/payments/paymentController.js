const Order = require("./../../models/orderModel");
const Cart = require("./../../models/cartModel");

const stripeService = require("./../../services/payment/stripeService");
const paypalService = require("./../../services/payment/paypalService");
const mtn_momoService = require("./../../services/payment/mtn_momoService");

const catchAsync = require("./../../utils/constants/catchAsync");
const APIFeatures = require("./../../utils/constants/apifeatures");
const AppError = require("./../../utils/constants/appError");

// Start Payment
// POST /api/payments/initialize/:orderId
exports.startPayment = catchAsync(async (req, res) => {
  const { orderId } = req.params;
  const { gateway } = req.body; // either Stripe, PayPal, or MTN momo
  const userId = req.user.id;

  // order
  const order = await Order.findById(orderId);
  if (!order) {
    return res.status(404).json({
      status: "error",
      message: "Order not found",
    });
  }

  // verify ownership
  if (order.user.toString() !== userId) {
    return res.status(403).json({
      status: "error",
      message: "Unauthorized",
    });
  }

  // checking if payment is done or not
  if (order.payment.status === "paid") {
    return res.status(400).json({
      status: "error",
      message: "Order already paid",
    });
  }

  // customer data
  const customer = {
    email: order.payment.customerEmail || req.user.email,
    phone: order.payment.customerPhone || req.user.phone,
    name: `${order.shippingAddress.firstName} ${order.shippingAddress.lastName}`,
  };

  let paymentData;

  // Start/Initialize based on the gateway
  switch (gateway) {
    case "paypal":
      paymentData = await paypalService.startPayment(order, customer);
      break;
    case "stripe":
      paymentData = await stripeService.startPayment(order, customer);
      break;
    case "mtn_momo":
      paymentData = await mtn_momoService.startPayment(order, customer);
      break;
    default:
      return res.status(400).json({
        status: "error",
        message: "Invalid payment gateway",
      });
  }

  // Updating order with gateway details
  order.payment.gateway = paymentData.gateway;
  order.payment.gatewayReference = paymentData.reference;
  await order.save();

  res.status(200).json({
    status: "success",
    message: "Payment initialized/started successfully",
    data: paymentData,
  });
});

// Verify Payment
// GET /api/payments/verify/:orderId
exports.verifyPayment = catchAsync(async (req, res) => {
  const { orderId } = req.params;
  const { transactionId, gateway } = req.query;

  const order = await Order.findById(orderId);

  if (!order) {
    return res.status(404).json({
      status: "error",
      message: "Order not found",
    });
  }
  // check if already verified
  if (order.payment.status === "completed") {
    return res.status(200).json({
      status: "success",
      message: "Payment already verified",
      data: { order },
    });
  }

  let verificationResult;
  // verify based on gateway
  switch (gateway || order.payment.gateway) {
    case "paypal":
      verificationResult = await paypalService.verifyPayment(transactionId);
      break;
    case "stripe":
      verificationResult = await stripeService.verifyPayment(transactionId);
      break;
    case "mtn_momo":
      verificationResult = await mtn_momoService.verifyPayment(transactionId);
      break;
    default:
      return res.status(400).json({
        status: "error",
        message: "Invalid payment gateway",
      });
  }

  // checking if the payment is successful or not
  if (
    verificationResult.success &&
    verificationResult.amount >= order.totalAmount
  ) {
    order.payment.status = "completed";
    order.payment.transactionId = verificationResult.transactionId;
    order.payment.paidAt = new Date();
    order.payment.gatewayResponse = verificationResult.data;
    order.status = "delivered";

    order.statusHistory.push({
      status: "delivered",
      timestamp: new Date(),
      note: "Payment verified and order confirmed",
    });

    await order.save();

    // clear the cart
    await Cart.findOneAndDelete({ user: order.user });

    res.status(200).json({
      status: "success",
      message: "Payment verified successfully",
      data: { order },
    });
  } else {
    order.payment.status = "failed";
    order.payment.failedAt = new Date();
    order.payment.failureReason = "Payment verification failed";
    order.payment.gatewayResponse = verificationResult.data;
    order.status = "cancelled";

    await order.save();
    res.status(400).json({
      status: "error",
      message: "Payment verification failed",
    });
  }
});

// Get Payment Status
// GET /api/payments/status/:orderId
exports.getPaymentStatus = catchAsync(async (req, res) => {
  const { orderId } = req.params;
  const userId = req.user.id;

  const order = await Order.findById(orderId).select(
    "orderNumber payment totalAmount status"
  );

  if (!order) {
    return res.status(404).json({
      status: "error",
      message: "Order not found",
    });
  }
  if (order.user.toString() !== userId && req.user.role !== "admin") {
    return res.status(403).json({
      status: "error",
      message: "Unauthorized",
    });
  }

  res.status(200).json({
    status: "success",
    data: {
      orderId: order._id,
      paymentStatus: order.payment.status,
      paymentMethod: order.payment.method,
      paymentGateway: order.payment.gateway,
      amount: order.totalAmount,
      transactionId: order.payment.transactionId,
      paidAt: order.payment.paidAt,
      orderStatus: order.status,
    },
  });
});

// Cancelling payment
// POST /api/payments/cancel/:orderId
exports.cancelPayment = catchAsync(async (req, res) => {
  const { orderId } = req.params;
  const { reason } = req.body;
  const userId = req.user.id;

  const order = await Order.findById(orderId);

  if (!order) {
    return res.status(404).json({
      status: "error",
      message: "Order not found",
    });
  }

  if (order.user.toString() !== userId) {
    return res.status(403).json({
      status: "error",
      message: "Unauthorized",
    });
  }

  if (order.payment.status === "paid") {
    return res.status(400).json({
      status: "error",
      message: "Cannot cancel paid order",
    });
  }

  order.payment.status = "failed";
  order.status = "cancelled";
  order.cancelledAt = new Date();
  order.cancelReason = reason || "Cancelled by user";

  await order.save;

  res.status(200).json({
    status: "success",
    message: "Payment cancelled successfully",
    data: { order },
  });
});

module.exports = exports;
