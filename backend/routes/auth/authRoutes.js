const express = require("express");
const router = express.Router();
const authController = require("./../../controllers/auth/authController");

const {
  protect,
  restrictTo,
  isNotAuthenticatedUser,
} = require("./../../middleware/auth/authenticate");

// register / sign up
// POST /api/v1/auth/register
// Create new user account
// Body: {
//   "firstName": "John",
//   "lastName": "Doe",
//   "email": "john@example.com",
//   "password": "SecurePass123",
//   "phone": "+1234567890" (optional)
// }
// Validations:
// - Email must be unique
// - Password min 6 characters
// - Email format validation
// Response: User created, JWT token returned

router.post("/register", isNotAuthenticatedUser, authController.signup);

// login / sign in
// POST /api/v1/auth/login
// Authenticate user with email and password
// Body: {
//   "email": "john@example.com",
//   "password": "SecurePass123"
// }
// Validations:
// - Email must exist
// - Password must be correct
// Response: JWT token + Refresh token + User info
// router.post("/login", isNotAuthenticatedUser, authController.login);
router.post("/login", authController.login);
// forgot password
// POST /api/v1/auth/forgot-password
// Request password reset email
// Body: {
//   "email": "john@example.com"
// }
// Behavior:
// - Generate password reset token (1 hour expiry)
// - Send reset link via email
// - User clicks link to reset password
// Response: { success, message: "Email sent" }
router.post(
  "/forgot-password",
  isNotAuthenticatedUser,
  authController.forgotPassword
);

// reset password
// PUT /api/v1/auth/reset-password/:token
// Reset password using token from email
// URL params: :token (from email link)
// Body: {
//   "newPassword": "NewSecurePass123",
//   "confirmPassword": "NewSecurePass123"
// }
// Validations:
// - Token must be valid and not expired
// - Passwords must match
// - New password min 6 characters
// Response: { success, message: "Password reset" }

router.patch(
  "/reset-password/:token",
  isNotAuthenticatedUser,
  authController.resetPassword
);

// verify email
// POST /api/v1/auth/verify-email/:token
// Verify user email address
// URL params: :token (from email link)
// Called when user clicks email verification link
// Behavior:
// - Verify token is valid
// - Mark user email as verified
// - User can now make purchases
// Response: { success, message: "Email verified" }
// I will implement this later
// router.post("/verify-email/:token", authController.verifyEmail)

// resend verification email
// refresh access token
// google login / OAUTH
// check email exists

// authenticated users only
// get current user
// logout user
// change password
// enable two-factor authentication
// verify 2FA code
// disable tow-factor authorization

// Admin routes
// Get All Sessions (GET /api/v1/auth/admin/sessions - Admin views all active user sessions)
// revoke user session -(Admin force logout a user)

module.exports = router;
