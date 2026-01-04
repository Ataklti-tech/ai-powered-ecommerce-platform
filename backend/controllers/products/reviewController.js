const Review = require("./../../models/reviewModel");
const Product = require("./../../models/productModel");
const User = require("./../../models/userModel");
const Order = require("./../../models/orderModel");
const catchAsync = require("./../../utils/constants/catchAsync");
const AppError = require("../../utils/constants/appError");
const sendEmail = require("./../../services/email/emailService");
const { trackActivity } = require("../analytics/userActivityController");

// creating review ( post review )
exports.createReview = catchAsync(async (req, res, next) => {
  const { productId, rating, title, comment } = req.body || {};
  const userId = req.user.id;

  // validating inputs
  if (!productId || !rating || !title || !comment) {
    return next(
      new AppError("product, rating, title, and comment are required", 400)
    );
  }

  if (rating < 1 || rating > 5) {
    return next(new AppError("Rating must be between 1 and 5", 400));
  }

  if (title.length < 3 || title.length > 100) {
    return next(
      new AppError("Title must be between 3 and 100 characters", 400)
    );
  }

  if (comment.length < 10 || comment.length > 5000) {
    return next(
      new AppError("comment must be between 10 and 5000 characters", 400)
    );
  }

  // check if product exists
  const product = await Product.findById(productId);
  if (!product) {
    return next(new AppError("Product not found", 404));
  }

  // Verify user purchased this product
  // Check if user has an order containing this product
  const order = await Order.findOne({
    user: userId,
    "items.product": productId,
    status: { $in: ["completed", "delivered"] }, // Only delivered orders can review
  });

  if (!order) {
    return next(
      new AppError(
        "You can only review products you have purchased and received",
        400
      )
    );
  }

  // Check if user already reviewed this product
  const existingReview = await Review.findOne({
    product: productId,
    user: userId,
  });

  if (existingReview) {
    return next(
      new AppError(
        "You have already reviewed this product. Update your review instead.",
        400
      )
    );
  }

  // Create review
  const review = await Review.create({
    product: productId,
    user: userId,
    rating,
    title,
    comment,
    // helpful: 0,
    // notHelpful: 0,
  });

  // Update product rating
  await updateProductRating(productId);

  // Send notification email to seller/admin
  const adminEmail = process.env.ADMIN_EMAIL || "admin@ecommerce.com";
  await sendEmail({
    email: adminEmail,
    subject: `New Review for ${product.name}`,
    message: `A new ${rating}-star review has been posted for ${product.name}`,
  });

  // Populate and return
  await review.populate("user", "name profileImage");

  // track review activity
  trackActivity(userId, productId, "review");

  res.status(201).json({
    success: true,
    message: "Review created successfully",
    data: review,
  });
});

// get all reviews for a product
// get all reviews for a specific product, support pagination, and sorting
// shows: reviewer name, rating, comment, date
exports.getProductReviews = catchAsync(async (req, res, next) => {
  // i will need apifeatures here
  const { productId } = req.params;

  const product = await Product.findById(productId);
  if (!product) {
    return next(new AppError("Product not found", 404));
  }

  // get reviews with pagination
  const reviews = await Review.find({ product: productId });

  const totalReviews = await Review.countDocuments({ product: productId });

  res.status(200).json({
    success: true,
    count: reviews.length,
    totalReviews,
    date: reviews,
  });
});

// get a single review
// getting a detailed information about a specific review
exports.getReview = catchAsync(async (req, res, next) => {
  const { reviewId } = req.params;

  const review = await Review.findById(reviewId)
    .populate("product", "name image price")
    .populate("user", "name profileImage email");

  if (!review) {
    return next(new AppError("Review not found", 404));
  }

  res.status(200).json({
    success: true,
    data: review,
  });
});

// update review
// users can update if they are the reviewer
exports.updateReview = catchAsync(async (req, res, next) => {
  const { reviewId } = req.params;
  const { rating, title, comment } = req.body;
  const userId = req.user.id;

  const review = await Review.findById(reviewId);

  if (!review) {
    return next(new AppError("Review not found", 404));
  }
  // check if user is the review author
  if (review.user.toString() !== userId && req.user.role !== "admin") {
    return next(new AppError("You can only update your own review", 403));
  }

  // Validate new inputs (if provided)
  if (rating && (rating < 1 || rating > 5)) {
    return next(new AppError("Rating must be between 1 and 5", 400));
  }

  if (title && (title.length < 3 || title.length > 100)) {
    return next(
      new AppError("Title must be between 3 and 100 characters", 400)
    );
  }

  if (comment && (comment.length < 10 || comment.length > 3000)) {
    return next(
      new AppError("Comment must be between 10 and 3000 characters", 400)
    );
  }

  // Update review
  if (rating) review.rating = rating;
  if (title) review.title = title;
  if (comment) review.comment = comment;
  review.updatedAt = new Date();

  await review.save();

  // Recalculate product rating
  await updateProductRating(review.product);

  await review.populate("user", "name profileImage");

  res.status(200).json({
    success: true,
    message: "Review updated successfully",
    data: review,
  });
});

// delete review
exports.deleteReview = catchAsync(async (req, res, next) => {
  const { reviewId } = req.params;
  const userId = req.user.id;

  const review = await Review.findById(reviewId);
  if (!review) {
    return next(new AppError("Review not found", 404));
  }

  // check authorization
  if (review.user.toString() !== userId && req.user.role !== "admin") {
    return next(new AppError("You can only delete your own review", 403));
  }

  const productId = review.product;

  // delete review
  await Review.findByIdAndDelete(reviewId);

  // recalculate product rating
  await updateProductRating(productId);

  res.status(200).json({
    success: true,
    message: "Review deleted successfully",
  });
});

// mark review as helpful
// mark review as not helpful
// exports.markReviewHelpful
// exports.markReviewNotHelpful

// get users reviews
//  get all reviews posted by a specific user / shows review history for that user
exports.getUserReview = catchAsync(async (req, res, next) => {
  const { userId } = req.params;
  // apifeatures will be needed here

  const user = await User.findById(userId);

  if (!user) {
    return next(new AppError("User not found", 404));
  }

  const reviews = await Review.find({ user: userId }).populate(
    "product",
    "name image price"
  );

  const totalReviews = await Review.countDocuments({ user: userId });

  res.status(200).json({
    success: true,
    count: reviews.length,
    totalReviews,
    data: reviews,
  });
});

// get reviews by rating
// getting reviews filtered by star rating
exports.getReviewsByRating = catchAsync(async (req, res, next) => {
  const { productId, rating } = req.params;
  // const { rating } = req.query;

  if (!rating || rating < 1 || rating > 5) {
    return next(new AppError("Rating must be between 1 and 5", 400));
  }

  const reviews = await Review.find({
    product: productId,
    rating: parseInt(rating),
  }).populate("user", "name profileImage");

  const totalReviews = await Review.countDocuments({
    product: productId,
    rating: parseInt(rating),
  });

  res.status(200).json({
    success: true,
    count: reviews.length,
    totalReviews,
    rating: parseInt(rating),
    data: reviews,
  });
});

// get review statistics for product
exports.getReviewStatistics = catchAsync(async (req, res, next) => {
  const { productId } = req.params;

  const product = await Product.findById(productId);

  if (!product) {
    return next(new AppError("Product not found", 404));
  }

  // get reviews grouped by rating
  const ratingDistribution = await Review.aggregate([
    { $match: { product: require("mongoose").Types.ObjectId(productId) } },
    {
      $group: {
        _id: "$rating",
        count: { $sum: 1 },
      },
    },
  ]);

  const totalReviews = await Review.countDocuments({ product: productId });

  const stats = {
    totalReviews,
    averageRating: product.rating.average,
    distribution: {
      5: 0,
      4: 0,
      3: 0,
      2: 0,
      1: 0,
    },
  };

  ratingDistribution.forEach((item) => {
    stats.distribution[item._id] = item.count;
  });

  // Calculate percentages
  Object.keys(stats.distribution).forEach((key) => {
    stats[`${key}StarPercentage`] = totalReviews
      ? ((stats.distribution[key] / totalReviews) * 100).toFixed(1)
      : 0;
  });

  res.status(200).json({
    success: true,
    data: stats,
  });
});

// admin approval for rejecting or accepting review by the admin
// exports.approveReview = catchAsync(async (req, res, next) => {});

// Helper functions
// recalculate product average
async function updateProductRating(productId) {
  // Get all reviews for product
  const reviews = await Review.find({ product: productId });

  if (reviews.length === 0) {
    // No reviews, reset to default
    await Product.findByIdAndUpdate(productId, {
      "rating.average": 0,
      "rating.count": 0,
      "rating.distribution": {
        5: 0,
        4: 0,
        3: 0,
        2: 0,
        1: 0,
      },
    });
    return;
  }

  // Calculate average
  const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
  const averageRating = (totalRating / reviews.length).toFixed(1);

  // Calculate distribution
  const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  reviews.forEach((review) => {
    distribution[review.rating]++;
  });

  // Update product
  await Product.findByIdAndUpdate(productId, {
    "rating.average": averageRating,
    "rating.count": reviews.length,
    "rating.distribution": distribution,
  });
}

// get top rated reviews
exports.getTopReviews = catchAsync(async (req, res, next) => {
  const { productId } = req.params;
  const limit = req.query.limit || 5;

  const reviews = await Review.find({ product: productId }).populate(
    "user",
    "name profileImage"
  );

  res.status(200).json({
    success: true,
    count: reviews.length,
    data: reviews,
  });
});

// search reviews
// search reviews by keyword
exports.searchReviews = catchAsync(async (req, res, next) => {
  const { query } = req.query;
  const { productId } = req.params;

  if (!query) {
    return next(new AppError("Search query is required", 400));
  }

  const reviews = await Review.find({
    product: productId,
    $or: [
      { title: { $regex: query, $options: "i" } },
      { comment: { $regex: query, $options: "i" } },
    ],
  }).populate("user", "name profilePicture");

  res.status(200).json({
    success: true,
    count: reviews.length,
    data: reviews,
  });
});
