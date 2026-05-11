const express = require('express');
const router = express.Router();
const productController = require('./../../controllers/products/productController');
const { protect, restrictTo } = require('./../../middleware/auth/authenticate');
const {
  uploadProductImages,
  processProductImages,
} = require('../../middleware/upload/s3Upload');

// ─── Public routes ────────────────────────────────────────────────────────
router.get('/', productController.getAllProducts);
router.get('/featured', productController.getFeaturedProducts);
router.get('/best-sellers', productController.getBestsellers);
router.get('/new-arrivals', productController.getNewArrivals);
router.get('/on-sale', productController.getOnSale);
router.get('/trending', productController.getTrending);
router.get('/hot', productController.getHotProducts);
router.get('/slug/:slug', productController.getProductBySlug);
router.get('/category/:categoryId', productController.getByCategory);
router.get('/category-name/:categoryName', productController.getByCategoryName);
router.get('/search', productController.searchProducts);

// ─── Admin-only management routes ────────────────────────────────────────
router.get(
  '/admin/low-stock',
  protect,
  restrictTo('admin'),
  productController.getLowStockProducts
);
router.get(
  '/admin/statistics',
  protect,
  restrictTo('admin'),
  productController.getProductStatistics
);
router.patch(
  '/admin/bulk-status',
  protect,
  restrictTo('admin'),
  productController.bulkUpdateStatus
);

// Create product (admin) — supports multipart/form-data with S3 image upload
router.post(
  '/',
  protect,
  restrictTo('admin'),
  uploadProductImages,
  processProductImages,
  productController.createProduct
);

// ─── Single product routes ────────────────────────────────────────────────
router.get('/:id', productController.getProduct);
router.get('/:id/related', productController.getRelatedProducts);
router.get('/:id/reviews', productController.getProductWithReviews);

// Update product (admin) — supports S3 image upload
router.patch(
  '/:id',
  protect,
  restrictTo('admin'),
  uploadProductImages,
  processProductImages,
  productController.updateProduct
);

// Delete product (admin)
router.delete(
  '/:id',
  protect,
  restrictTo('admin'),
  productController.deleteProduct
);

// Add to cart / wishlist (user)
router.post('/:id/cart', protect, productController.addToCart);
router.post('/:id/wishlist', protect, productController.addToWishlist);

// Stock management (admin)
router.patch(
  '/:id/reduce-stock',
  protect,
  restrictTo('admin'),
  productController.reduceStock
);
router.patch(
  '/:id/restore-stock',
  protect,
  restrictTo('admin'),
  productController.restoreStock
);

// Analytics & rating (authenticated)
router.patch('/:id/analytics', protect, productController.updateProductAnalytics);
router.patch('/:id/rating', protect, productController.updateProductRating);

module.exports = router;
