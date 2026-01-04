const express = require("express");
const router = express.Router();
const orderController = require("./../../controllers/orders/orderController");
const { protect, restrictTo } = require("./../../middleware/auth/authenticate");
const checkoutController = require("./../../controllers/orders/checkoutController");
// routes

// checkout routes -
// validate checkout
router.post("/checkout/validate", protect, checkoutController.validateCheckOut);

// checkout preview
router.get("/checkout/preview", protect, checkoutController.getCheckoutPreview);

// confirm checkout
router.post("/checkout/confirm", protect, checkoutController.confirmCheckOut);

// apply coupon
router.post("/checkout/apply-coupon", protect, checkoutController.applyCoupon);

// estimate shipping
router.post(
  "/checkout/estimate-shipping",
  protect,
  checkoutController.estimateShipping
);
// Admin routes
// get all orders / admin sees all orders from all users
router.get(
  "/admin/all-orders",
  protect,
  restrictTo("admin"),
  orderController.getAllOrdersAdmin
);

// update order status (admin only)
router.put(
  "/:orderId/status",
  protect,
  restrictTo("admin"),
  orderController.updateOrderStatus
);

// update payment status (admin, system)
router.put(
  "/:orderId/payment-status",
  protect,
  restrictTo("admin"),
  orderController.updatePaymentStatus
);

// get order statistics
router.get(
  "/admin/statistics",
  protect,
  restrictTo("admin"),
  orderController.getOrderStatistics
);

// //////////////////////
// Creating an order
router.post("/", protect, orderController.createOrder);

// get all user orders
router.get("/", protect, orderController.getAllOrders);

// get single order details
router.get("/:orderId", protect, orderController.getOrder);

// get track order status
router.get("/:orderId/tracking", protect, orderController.getOrderTracking);

// cancel order
router.put("/:orderId/cancel", protect, orderController.cancelOrder);

// generate invoice
router.get("/:orderId/invoice", protect, orderController.generateInvoice);

module.exports = router;

// API Endpoints:
//
// POST   /api/v1/orders/checkout/validate
// GET    /api/v1/orders/checkout/preview
// POST   /api/v1/orders/checkout/confirm
// POST   /api/v1/orders/checkout/apply-coupon
// POST   /api/v1/orders/checkout/estimate-shipping
