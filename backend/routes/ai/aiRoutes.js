const express = require('express');
const router = express.Router();
const recommendationController = require('../../controllers/ai/recommendationController');
const { protect } = require('../../middleware/auth/authenticate');
const trackRecommendationInteraction = require('../../middleware/recTracking');

// Health check (public)
router.get('/health', recommendationController.checkHealth);

// Get homepage recommendations (public - for logged out users)
router.get('/homepage', recommendationController.getHomepageRecommendations);

// Smart "For You" endpoint — requires auth
// Returns "Trending For You" for new users, "Recommended For You" for returning users
router.get('/for-you', protect, recommendationController.getForYouRecommendations);

// Full personalized recommendation list with product names (auth required)
// Uses order history + activity log + wishlist → weighted category → KNN popularity
router.get('/my-recommendations', protect, recommendationController.getMyRecommendations);

// Recommendation tracking middleware for AI endpoints below this line
router.use(trackRecommendationInteraction);

// Get personalized recommendations (requires auth + tracking)
router.get(
  '/recommendations',
  protect,
  recommendationController.getRecommendations
);

// Get similar products (public + tracking)
router.get('/similar/:productId', recommendationController.getSimilarProducts);

// Get frequently bought together (public + tracking)
router.get(
  '/bought-together/:productId',
  recommendationController.getBoughtTogether
);

// Track user events (requires auth)
router.post('/track', protect, recommendationController.trackEvent);

module.exports = router;
