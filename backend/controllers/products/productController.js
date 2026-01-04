const AppError = require("../../utils/constants/appError");
const catchAsync = require("../../utils/constants/catchAsync");
const Product = require("./../../models/productModel");
const APIFeatures = require("./../../utils/constants/apifeatures");
const {
  trackActivity,
} = require("./../../controllers/analytics/userActivityController");

// Route handlers
// create product (admin only)
exports.createProduct = catchAsync(async (req, res, next) => {
  const product = await Product.create(req.body);
  res.status(201).json({
    success: true,
    message: "Product created successfully",
    data: product,
  });
});

// get all products
exports.getAllProducts = catchAsync(async (req, res) => {
  const apifeatures = new APIFeatures(Product.find(), req.query)
    .filter()
    .sort()
    .limitFields()
    .paginate();
  const products = await apifeatures.query;
  const totalProducts = await Product.countDocuments();

  res.status(200).json({
    success: true,
    count: products.length,
    totalProducts,
    data: products,
  });
});

// get a single product
exports.getProduct = catchAsync(async (req, res, next) => {
  const product = await Product.findById(req.params.id);
  if (!product) {
    return next(new AppError("Product not found", 404));
  }
  // updateAnalytics
  product.updateAnalytics("view");

  if (req.user) {
    trackActivity(req.user.id, product._id, "view");
  }
  await product.save();

  res.status(200).json({
    success: true,
    data: product,
  });
});

// Get product by slug
exports.getProductBySlug = catchAsync(async (req, res, next) => {
  const product = await Product.findOne({ slug: req.params.slug });

  if (!product) {
    return next(new AppError("Product not found", 404));
  }

  product.updateAnalytics("view");
  await product.save();

  res.status(200).json({
    success: true,
    data: product,
  });
});

// Update Product (Admin Only)
exports.updateProduct = catchAsync(async (req, res, next) => {
  let product = await Product.findById(req.params.id);

  if (!product) {
    return next(new AppError("Product not found", 404));
  }

  product = await Product.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    success: true,
    message: "Product updated successfully",
    data: product,
  });
});

// Delete Product (Admin Only)
exports.deleteProduct = catchAsync(async (req, res, next) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    return next(new AppError("Product not found", 404));
  }

  await Product.findByIdAndDelete(req.params.id);

  res.status(200).json({
    success: true,
    message: "Product deleted successfully",
  });
});

// Get Featured Products
exports.getFeaturedProducts = catchAsync(async (req, res, next) => {
  const limit = Number(req.query.limit) || 10;
  const products = await Product.getFeatured(limit);

  res.status(200).json({
    success: true,
    count: products.length,
    data: products,
  });
});

// Get Bestseller Products
exports.getBestsellers = catchAsync(async (req, res, next) => {
  const limit = Number(req.query.limit) || 10;
  const products = await Product.getBestsellers(limit);

  res.status(200).json({
    success: true,
    count: products.length,
    data: products,
  });
});

// Get New Arrivals
exports.getNewArrivals = catchAsync(async (req, res, next) => {
  const limit = Number(req.query.limit) || 10;
  const days = req.query.days || 30;
  const products = await Product.getNewArrivals(limit, days);

  res.status(200).json({
    success: true,
    count: products.length,
    data: products,
  });
});

// Get Products on Sale
exports.getOnSale = catchAsync(async (req, res, next) => {
  const limit = Number(req.query.limit) || 10;
  const products = await Product.getOnSale(limit);

  res.status(200).json({
    success: true,
    count: products.length,
    data: products,
  });
});

// Get Trending Products
exports.getTrending = catchAsync(async (req, res, next) => {
  const limit = Number(req.query.limit) || 10;
  const days = req.query.days || 7;
  const products = await Product.getTrending(limit, days);

  res.status(200).json({
    success: true,
    count: products.length,
    data: products,
  });
});

// Search Products
exports.searchProducts = catchAsync(async (req, res, next) => {
  const { searchTerm } = req.query;

  if (!searchTerm) {
    return next(new AppError("Search term is required", 400));
  }

  const filters = {
    minPrice: req.query.minPrice,
    maxPrice: req.query.maxPrice,
    category: req.query.category,
    brand: req.query.brand,
    minRating: req.query.minRating,
  };

  const products = await Product.searchProducts(searchTerm, filters);

  // tracking search activity
  if (req.user && products.length > 0) {
    trackActivity(req.user.id, products[0]._id, "search");
  }

  res.status(200).json({
    success: true,
    count: products.length,
    data: products,
  });
});

// Get Related Products
exports.getRelatedProducts = catchAsync(async (req, res, next) => {
  const limit = Number(req.query.limit) || 5;
  const products = await Product.getRelatedProducts(req.params.id, limit);

  res.status(200).json({
    success: true,
    count: products.length,
    data: products,
  });
});

// Get Products by Category
exports.getByCategory = catchAsync(async (req, res, next) => {
  const { categoryId } = req.params;
  const page = req.query.page || 1;
  const limit = Number(req.query.limit) || 12;

  const products = await Product.getByCategory(categoryId, page, limit);
  const totalCount = await Product.countDocuments({
    category: categoryId,
    status: "active",
  });

  res.status(200).json({
    success: true,
    count: products.length,
    totalCount,
    page,
    limit,
    data: products,
  });
});

// Get Low Stock Products (Admin Only)
exports.getLowStockProducts = catchAsync(async (req, res, next) => {
  const products = await Product.getLowStockProducts();

  res.status(200).json({
    success: true,
    count: products.length,
    data: products,
  });
});

// Update Product Analytics
exports.updateProductAnalytics = catchAsync(async (req, res, next) => {
  const { action, quantity } = req.body;

  const product = await Product.findById(req.params.id);

  if (!product) {
    return next(new AppError("Product not found", 404));
  }

  product.updateAnalytics(action, quantity);
  await product.save();

  res.status(200).json({
    success: true,
    message: "Analytics updated successfully",
    data: product.analytics,
  });
});

// Add to Cart (Update Analytics)
exports.addToCart = catchAsync(async (req, res, next) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    return next(new AppError("Product not found", 404));
  }

  product.updateAnalytics("addToCart");
  await product.save();

  res.status(200).json({
    success: true,
    message: "Product added to cart analytics",
    data: product,
  });
});

// Add to Wishlist (Update Analytics)
exports.addToWishlist = catchAsync(async (req, res, next) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    return next(new AppError("Product not found", 404));
  }

  product.updateAnalytics("wishlist");
  await product.save();

  res.status(200).json({
    success: true,
    message: "Product added to wishlist analytics",
    data: product,
  });
});

// Reduce Product Stock (After Purchase)
exports.reduceStock = catchAsync(async (req, res, next) => {
  const { quantity } = req.body;

  if (!quantity || quantity <= 0) {
    return next(new AppError("Invalid quantity", 400));
  }

  const product = await Product.findById(req.params.id);

  if (!product) {
    return next(new AppError("Product not found", 404));
  }

  if (!product.checkStock(quantity)) {
    return next(
      new AppError(`Insufficient stock. Available: ${product.stock}`, 400)
    );
  }

  await product.reduceStock(quantity);

  res.status(200).json({
    success: true,
    message: "Stock reduced successfully",
    remainingStock: product.stock,
    data: product,
  });
});

// Restore Product Stock (Order Cancelled)
exports.restoreStock = catchAsync(async (req, res, next) => {
  const { quantity } = req.body;

  if (!quantity || quantity <= 0) {
    return next(new AppError("Invalid quantity", 400));
  }

  const product = await Product.findById(req.params.id);

  if (!product) {
    return next(new AppError("Product not found", 404));
  }

  await product.restoreStock(quantity);

  res.status(200).json({
    success: true,
    message: "Stock restored successfully",
    currentStock: product.stock,
    data: product,
  });
});

// Get Product with Reviews
exports.getProductWithReviews = catchAsync(async (req, res, next) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    return next(new AppError("Product not found", 404));
  }

  await product.getProductWithReviews();

  res.status(200).json({
    success: true,
    data: product,
  });
});

// Get Product for API Response
exports.getProductAPI = catchAsync(async (req, res, next) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    return next(new AppError("Product not found", 404));
  }

  const apiResponse = product.toAPI();

  res.status(200).json({
    success: true,
    data: apiResponse,
  });
});

// Get Hot Products (Recommendation)
exports.getHotProducts = catchAsync(async (req, res, next) => {
  const limit = req.query.limit || 10;

  const products = await Product.find({
    status: "active",
    $or: [
      { "analytics.purchases": { $gt: 50 } },
      { "analytics.views": { $gt: 500 } },
    ],
  })
    .sort({ "analytics.purchases": -1 })
    .limit(limit);

  res.status(200).json({
    success: true,
    count: products.length,
    data: products,
  });
});

// Update Product Rating
exports.updateProductRating = catchAsync(async (req, res, next) => {
  const { rating } = req.body;

  if (rating < 1 || rating > 5) {
    return next(new AppError("Rating must be between 1 and 5", 400));
  }

  const product = await Product.findById(req.params.id);

  if (!product) {
    return next(new AppError("Product not found", 404));
  }

  // Update rating distribution
  const ratingKey = Math.round(rating);
  product.rating.distribution[ratingKey] += 1;

  // Recalculate average rating
  let totalRatings = 0;
  let sumRatings = 0;

  for (let i = 1; i <= 5; i++) {
    totalRatings += product.rating.distribution[i];
    sumRatings += i * product.rating.distribution[i];
  }

  product.rating.average = (sumRatings / totalRatings).toFixed(1);
  product.rating.count = totalRatings;

  await product.save();

  res.status(200).json({
    success: true,
    message: "Product rating updated successfully",
    data: product.rating,
  });
});

// Bulk Update Product Status (Admin Only)
exports.bulkUpdateStatus = catchAsync(async (req, res, next) => {
  const { productIds, status } = req.body;

  if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
    return next(new AppError("Invalid product IDs", 400));
  }

  const validStatuses = ["draft", "active", "inactive", "out_of_stock"];
  if (!validStatuses.includes(status)) {
    return next(new AppError("Invalid status", 400));
  }

  const result = await Product.updateMany(
    { _id: { $in: productIds } },
    { status }
  );

  res.status(200).json({
    success: true,
    message: "Products status updated successfully",
    modifiedCount: result.modifiedCount,
  });
});

// Get Product Statistics (Admin Only)
exports.getProductStatistics = catchAsync(async (req, res, next) => {
  const totalProducts = await Product.countDocuments();
  const activeProducts = await Product.countDocuments({ status: "active" });
  const outOfStockProducts = await Product.countDocuments({
    status: "out_of_stock",
  });
  const featuredProducts = await Product.countDocuments({ isFeatured: true });
  const saleProducts = await Product.countDocuments({ isOnSale: true });
  const bestsellerProducts = await Product.countDocuments({
    isBestseller: true,
  });

  const avgRating = await Product.aggregate([
    {
      $group: {
        _id: null,
        averageRating: { $avg: "$rating.average" },
        totalViews: { $sum: "$analytics.views" },
        totalPurchases: { $sum: "$analytics.purchases" },
      },
    },
  ]);

  res.status(200).json({
    success: true,
    data: {
      totalProducts,
      activeProducts,
      outOfStockProducts,
      featuredProducts,
      saleProducts,
      bestsellerProducts,
      statistics: avgRating[0] || {},
    },
  });
});
