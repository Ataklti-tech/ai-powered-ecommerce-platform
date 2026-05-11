// Recommendation Tracking Middleware
const UserActivity = require('../models/userActivityModel');
const catchAsync = require('../utils/constants/catchAsync');

/**
 * Track recommendation impressions and clicks
 * Logs to userActivity collection for model retraining
 */
const trackRecommendationInteraction = async (req, res, next) => {
  // Only track when a specific product ID is present (similar / bought-together)
  const userId = req.user?.id;
  const productId = req.params.productId;

  if (userId && productId) {
    const activityType = req.path.includes('similar')
      ? 'similar_impression'
      : req.path.includes('bought-together')
        ? 'bundle_impression'
        : 'rec_impression';

    // Fire-and-forget — never block the response for tracking
    UserActivity.create({
      user: userId,
      product: productId,
      activityType,
      metadata: { endpoint: req.originalUrl },
    }).catch((err) => console.error('recTracking error:', err.message));
  }

  next();
};

module.exports = trackRecommendationInteraction;
