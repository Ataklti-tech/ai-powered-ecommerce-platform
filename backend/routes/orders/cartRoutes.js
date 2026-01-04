const express = require("express");
const router = express.Router();
const cartController = require("./../../controllers/orders/cartController");
const { protect, restrictTo } = require("./../../middleware/auth/authenticate");

// getting user cart
router.get("/", protect, cartController.getCart);

// adding product to cart
router.post("/add", protect, cartController.addProductToCart);

// increasing item quantity by 1
// router.patch("/increase/:productId", protect, cartController.increaseQuantity);

// decreasing item quantity by 1
// router.patch()

// set exact quantity
// router.patch("/set-quantity/:productId", protect, cartController.)

// update cart
router.put("/:productId", protect, cartController.updateCartItem);

// remove item from cart
router.delete("/:productId", protect, cartController.removeItem);

// clear entire cart
// router.delete("/", protect, cartController.deleteCart);

// get cart summary
router.get("/summary", protect, cartController.getCartSummary);

// validate cart
router.post("/validate", protect, cartController.validateCart);

// applying coupon
// router.post("/apply-coupon", protect, cartController.)

// merge cart
router.post("/merge", protect, cartController.mergeCarts);

// admin
// delete user's cart

module.exports = router;
