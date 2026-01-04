const express = require("express");
const router = express.Router();
const userController = require("./../../controllers/auth/userController");
const authController = require("./../../controllers/auth/authController");
const { protect, restrictTo } = require("./../../middleware/auth/authenticate");
// Creating user
router.post("/signup", userController.createUser);

// Protected routes
// Get current logged in user
router.get("/profile", protect, userController.getCurrentUser);

// Admin only routes
// Get all users
router.get("/", protect, userController.getAllUsers);
// router.get("/", userController.getAllUsers);

// Get single user by id
router.get("/:id", protect, userController.getUser);

// Get user by email
router.get("/email/:email", userController.getUserByEmail);

// Search users
router.get("/search/:search", userController.searchUsers);

// Update user data
router.put("/:id", userController.updateUserData);

// Toggle user role (admin only)
router.put("./:id/toggle-role", userController.toggleUserRole);

// Get user statistics
router.get("/admin/statistics", userController.getUserStatistics);

//

// router.route().get();

module.exports = router;
