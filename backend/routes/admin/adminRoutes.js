const express = require('express');
const router = express.Router();

const { protect } = require('../../middleware/auth/authenticate');
const { restrictTo } = require('../../middleware/auth/authorize');
const {
  uploadProductImages,
  processProductImages,
  uploadCategoryImage,
  processCategoryImage,
} = require('../../middleware/upload/s3Upload');

const {
  // Dashboard
  getDashboardStats,
  getRevenueAnalytics,

  // Users
  getAllUsers,
  getUserDetail,
  updateUserRole,
  deactivateUser,
  activateUser,

  // Products
  adminCreateProduct,
  adminUpdateProduct,
  adminDeleteProduct,
  getLowStockProducts,
  getProductStats,

  // Orders
  getAllOrdersAdmin,
  adminUpdateOrderStatus,

  // Activities
  getAllActivities,
  getActivitySummary,

  // Categories
  adminCreateCategory,
  adminUpdateCategory,
} = require('../../controllers/admin/adminController');

// All admin routes require authentication + admin role
router.use(protect, restrictTo('admin'));

// ─── Dashboard ─────────────────────────────────────────────────────────────
router.get('/dashboard', getDashboardStats);
router.get('/revenue', getRevenueAnalytics);

// ─── Users ─────────────────────────────────────────────────────────────────
router.get('/users', getAllUsers);
router.get('/users/:id', getUserDetail);
router.patch('/users/:id/role', updateUserRole);
router.patch('/users/:id/deactivate', deactivateUser);
router.patch('/users/:id/activate', activateUser);

// ─── Products ──────────────────────────────────────────────────────────────
router.get('/products/stats', getProductStats);
router.get('/products/low-stock', getLowStockProducts);
router.post(
  '/products',
  uploadProductImages,
  processProductImages,
  adminCreateProduct
);
router.patch(
  '/products/:id',
  uploadProductImages,
  processProductImages,
  adminUpdateProduct
);
router.delete('/products/:id', adminDeleteProduct);

// ─── Categories ────────────────────────────────────────────────────────────
router.post(
  '/categories',
  uploadCategoryImage,
  processCategoryImage,
  adminCreateCategory
);
router.patch(
  '/categories/:id',
  uploadCategoryImage,
  processCategoryImage,
  adminUpdateCategory
);

// ─── Orders ────────────────────────────────────────────────────────────────
router.get('/orders', getAllOrdersAdmin);
router.patch('/orders/:id/status', adminUpdateOrderStatus);

// ─── Activity Monitoring ───────────────────────────────────────────────────
router.get('/activities', getAllActivities);
router.get('/activities/summary', getActivitySummary);

module.exports = router;
