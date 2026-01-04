const express = require("express");
const router = express.Router();

const reviewController = require("./../../controllers/products/reviewController");
const { protect, restrictTo } = require("./../../middleware/auth/authenticate");

// get all reviews for a product
// GET /api/v1/reviews/product/:productId
// Retrieve all reviews for a specific product
// Query params:
//   - page: Page number (default: 1)
//   - limit: Reviews per page (default: 10)
//   - sort: Sort field (default: -createdAt for newest first)
// Sort options:
//   - -createdAt: Newest first
//   - createdAt: Oldest first
//   - -helpful: Most helpful first
//   - rating: Low to high
//   - -rating: High to low
// Response: Array of reviews with pagination
router.get("/product/:productId", reviewController.getProductReviews);

// get reviews by rating filter
// GET /api/v1/reviews/product/:productId/rating/:rating
// Get reviews filtered by star rating
// URL params:
//   - productId: Product MongoDB ID
//   - rating: Star rating (1-5)
// Query params:
//   - page: Page number (default: 1)
//   - limit: Per page (default: 10)
// Response: Reviews matching the rating filter
// Example: Get all 5-star reviews
router.get(
  "/product/:productId/rating/:rating",
  reviewController.getReviewsByRating
);

// get top/most helpful reviews
// GET /api/v1/reviews/product/:productId/top
// Get most helpful reviews for a product
// Query params:
//   - limit: Number of reviews (default: 5)
// Sorted by helpful count (most helpful first)
// Perfect for featured/highlighted reviews
router.get("/product/:productId/top", reviewController.getTopReviews);

// get review statistics for product
// GET /api/v1/reviews/product/:productId/statistics
// Get rating breakdown and statistics
// Returns: {
//   totalReviews: 150,
//   averageRating: 4.5,
//   5StarPercentage: "60%",
//   4StarPercentage: "25%",
//   distribution: { 5: 90, 4: 37, 3: 15, 2: 5, 1: 3 }
// }
// Used for product page rating display
router.get(
  "/product/:productId/statistics",
  reviewController.getReviewStatistics
);

// search reviews
// GET /api/v1/reviews/product/:productId/search?query=...
// Search reviews by keyword
// Query params:
//   - query: Search term (min 2 characters)
// Searches in: title, description
// Response: Matching reviews (max 20)
// Example: Search for "durable" or "broken"
router.get("/product/:productId/search", reviewController.searchReviews);

// get single review
// GET /api/v1/reviews/:reviewId
// Get complete details of a specific review
// URL params:
//   - reviewId: Review MongoDB ID
// Response: Single review with product and user info
router.get("/:reviewId", reviewController.getReview);

// Authenticated user only

// create new review
// POST /api/v1/reviews
// User creates a review for purchased product
// Body: {
//   "productId": "PROD_123",
//   "rating": 5,
//   "title": "Excellent Product!",
//   "description": "This product exceeded my expectations..."
// }
// Validations:
// - User must be logged in
// - User must have purchased the product
// - Order must be delivered
// - Rating must be 1-5
// - Title: 3-100 characters
// - Description: 10-5000 characters
// - Cannot review same product twice
// Response: Created review
router.post("/", protect, reviewController.createReview);

// update own review
// PUT /api/v1/reviews/:reviewId
// User updates their own review
// Body: {
//   "rating": 4,
//   "title": "Updated title",
//   "description": "Updated description"
// }
// Restrictions:
// - User can only update their own review
// - Admin can update any review
// - Same validation as create
// Response: Updated review
router.put("/:reviewId", protect, reviewController.updateReview);

// Delete own review
// DELETE /api/v1/reviews/:reviewId
// User deletes their own review
// URL params:
//   - reviewId: Review MongoDB ID
// Restrictions:
// - User can only delete their own review
// - Admin can delete any review
// - Product rating automatically recalculated
// Response: Success message
router.delete("/:reviewId", protect, reviewController.deleteReview);

// mark review as helpful
// I will implement this later for both the routes and the controller also

// mark review as not helpful
//

// get user's reviews
// GET /api/v1/reviews/user/:userId
// Get all reviews posted by a specific user
// URL params:
//   - userId: User MongoDB ID
// Query params:
//   - page: Page number (default: 1)
//   - limit: Reviews per page (default: 10)
// Response: All reviews from this user
router.get("/user/:userId", reviewController.getUserReview);
// admin only routes

// approve review, - this will be implemented later

module.exports = router;
