const express = require("express");
const router = express.Router();
const productController = require("./../../controllers/products/productController");
const { protect, restrictTo } = require("./../../middleware/auth/authenticate");

// get all products
router.get("/", protect, restrictTo("admin"), productController.getAllProducts);

// create product (admin only)
// router.post("/", protect, restrictTo("admin"), productController.createProduct);
router.post("/", protect, restrictTo("admin"), productController.createProduct);

// get featured products
router.get("/featured", productController.getFeaturedProducts);

// get a single product with id
router.get("/:id", productController.getProduct);

// update product
router.patch(
  "/:id",
  protect,
  restrictTo("admin"),
  productController.updateProduct
);

// delete product (admin only)
router.delete(
  "/:id",
  protect,
  restrictTo("admin"),
  productController.deleteProduct
);

// search product
router.get("/search", productController.searchProducts);

// get best seller products
router.get("/best-sellers", productController.getBestsellers);

// new arrivals
router.get("/new-arrivals", productController.getNewArrivals);

// on sale
router.get("/on-sale", productController.getOnSale);

// trending
router.get("/trending", productController.getTrending);

// hot
router.get("/hot", productController.getHotProducts);

// get by category
router.get("/category/:categoryId", productController.getByCategory);

// get related products
router.get("/:id/related", productController.getRelatedProducts);

// get reviews of a product
router.get("/:id/reviews", productController.getProductWithReviews);

// get product by slug
router.get("/slug/:slug", productController.getProductBySlug);

// get product api
router.get("/:id", productController.getProductAPI);

// add product to cart
router.post("/:id/cart", protect, productController.addToCart);

// add product to wishlist
router.post("/:id/wishlist", protect, productController.addToWishlist);

// get low stock products
router.get(
  "/admin/low-stock",
  protect,
  restrictTo("admin"),
  productController.getLowStockProducts
);

// update analytics
router.patch(
  ":id/analytics",
  protect,
  productController.updateProductAnalytics
);

// bulk update
router.patch(
  "/admin/bulk-status",
  protect,
  restrictTo("admin"),
  productController.bulkUpdateStatus
);

// product statistics
router.get(
  "/admin/statistics",
  protect,
  restrictTo("admin"),
  productController.getProductStatistics
);

// Stock management routes - Protected
router.patch(
  "/:id/reduce-stock",
  protect,
  restrictTo("admin"),
  productController.reduceStock
);
router.patch(
  "/:id/restore-stock",
  protect,
  restrictTo("admin"),
  productController.restoreStock
);

// Rating routes - Protected
router.patch("/:id/rating", protect, productController.updateProductRating);

module.exports = router;
