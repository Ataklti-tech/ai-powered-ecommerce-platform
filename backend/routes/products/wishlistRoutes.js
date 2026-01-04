const express = require("express");
const router = express.Router();
const wishlistController = require("../../controllers/products/wishlistController");

const { protect, restrictTo } = require("./../../middleware/auth/authenticate");

// get user wishlist
// GET /api/v1/wishlist
router.get("/", protect, wishlistController.getWishlist);

// get wishlist with full details
// GET /api/v1/wishlist/details
// Get wishlist items with complete product information
router.get("/details", protect, wishlistController.getWishlistWithDetails);

// get wishlist count
// GET /api/v1/wishlist/count
// Get total number of items in wishlist
router.get("/count", protect, wishlistController.getWishlistCount);

// get wishlist statistics
// GET /api/v1/wishlist/statistics
// Get statistics about wishlist
router.get("statistics", protect, wishlistController.getWishlistStatistics);

// get wishlist recommendations
// GET /api/v1/wishlist/recommendations
// Get recommended products based on wishlist
router.get(
  "/recommendations",
  protect,
  wishlistController.getWishlistRecommendations
);

// check if product in wishlist
// GET /api/v1/wishlist/check/:productId
// Check if a product is in user's wishlist
router.get(
  "/check/:productId",
  protect,
  wishlistController.checkWishlistStatus
);

// add product to wishlist
// POST /api/v1/wishlist/add
// Add a single product to wishlist
// Body: { "productId": "PROD_123" }
// Validations:
// - Product must exist
// - Product not already in wishlist
// Response: Updated wishlist
router.post("/add", protect, wishlistController.addProductToWishlist);

// add multiple products to wishlist
// POST /api/v1/wishlist/add-multiple
// Batch add multiple products at once
// Body: {
//   "productIds": ["PROD_1", "PROD_2", "PROD_3"]
// }
// Limits:
// - Maximum 50 items per request
router.post(
  "/add-multiple",
  protect,
  wishlistController.addMultipleProductsToWishlist
);

// remove product from wishlist
// DELETE /api/v1/wishlist/:productId
// Remove single product from wishlist
router.delete(
  "/:productId",
  protect,
  wishlistController.removeProductFromWishlist
);

// remove multiple products from wishlist
// POST /api/v1/wishlist/remove-multiple
// Batch remove multiple products
// Body: {
//   "productIds": ["PROD_1", "PROD_2", "PROD_3"]
// }
// Response: {
//   removedCount: 3,
//   failedCount: 0,
//   removedItems: [...],
//   failedItems: [...],
//   wishlistCount: 12
// }
router.post(
  "/remove-multiple",
  protect,
  wishlistController.removeMultipleProductsFromWishlist
);

// move item to cart
// PUT /api/v1/wishlist/:productId/move-to-cart
// Move product from wishlist to cart
// URL params:
//   - productId: Product MongoDB ID
// Body: { "quantity": 1 } (optional)
// Behavior:
// - Removes from wishlist
// - Adds to cart
// - Validates stock availability
// Response: {
//   wishlistCount: 14,
//   cartCount: 5
// }
router.put("/:productId/move-to-cart", protect, wishlistController.moveToCart);

// clear entire wishlist
// DELETE /api/v1/wishlist
// Remove all products from wishlist
// Empties entire wishlist
// Used when user clicks "Clear Wishlist" button
// Response: Success message, empty wishlist
router.delete("/", protect, wishlistController.clearWishlist);

// notify on price drops
// POST /api/v1/wishlist/notify-price-drops
// Get email notification on wishlist price drops
// Behavior:
// - Checks for items with reduced prices
// - Sends email with price comparison
// - Shows savings amount
router.post(
  "/notify-price-drops",
  protect,
  wishlistController.notifyPriceDrops
);

module.exports = router;
