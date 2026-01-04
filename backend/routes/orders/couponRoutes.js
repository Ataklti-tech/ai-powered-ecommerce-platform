const express = require("express");
const router = express.Router();
const couponController = require("./../../controllers/orders/couponController");

const { protect, restrictTo } = require("./../../middleware/auth/authenticate");

// Public routes
router.get("/active", protect, couponController.getActiveCoupons);

// Protected routes - require authentication
// router.use(protect);

// User routes - validate coupon before checkout
router.post("/validate", protect, couponController.validateCoupon);

// Admin only routes
// router.use(isAdmin);

router.post("/", protect, couponController.createCoupon);
router.get("/", protect, restrictTo("admin"), couponController.getAllCoupons);
router.patch(
  "/:id",
  protect,
  restrictTo("admin"),
  couponController.updateCoupon
);
router.delete(
  "/:id",
  protect,
  restrictTo("admin"),
  couponController.deleteCoupon
);
router.patch(
  "/:id/toggle-status",
  protect,
  restrictTo("admin"),
  couponController.toggleCouponStatus
);

module.exports = router;
