const express = require('express');
const router = express.Router();
const userController = require('./../../controllers/auth/userController');
const { protect, restrictTo } = require('./../../middleware/auth/authenticate');

// ─── Public ──────────────────────────────────────────────────────────────────
// Signup (creates a regular user; use /api/v1/auth/create-admin for admins)
router.post('/signup', userController.createUser);

// Get user by email (used internally / for lookups)
router.get('/email/:email', userController.getUserByEmail);

// Search users
router.get('/search', userController.searchUsers);

// ─── Authenticated ────────────────────────────────────────────────────────────
router.get('/profile', protect, userController.getCurrentUser);

// ─── Admin only ───────────────────────────────────────────────────────────────
// These must be declared before /:id so Express doesn't swallow them
router.get(
  '/admin/statistics',
  protect,
  restrictTo('admin'),
  userController.getUserStatistics
);

// Get all users
router.get('/', protect, restrictTo('admin'), userController.getAllUsers);

// Get single user by id
router.get('/:id', protect, userController.getUser);

// Update user data (admin can update role; user can update own profile fields)
router.put('/:id', protect, userController.updateUserData);

// Toggle user role (admin only)
router.put(
  '/:id/toggle-role',
  protect,
  restrictTo('admin'),
  userController.toggleUserRole
);

// ─── Address routes ───────────────────────────────────────────────────────────
router.get('/addresses', protect, userController.getUserAddresses);
router.post('/addresses', protect, userController.updateUserAddress);
router.put('/addresses/:addressId', protect, userController.updateSpecificAddress);
router.delete('/addresses/:addressId', protect, userController.deleteUserAddress);

module.exports = router;
