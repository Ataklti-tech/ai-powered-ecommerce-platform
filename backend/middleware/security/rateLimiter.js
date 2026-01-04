const rateLimit = require("express-rate-limit");

// API Rate Limiter
exports.apiLimiter = rateLimit({
  windowMs: 30 * 60 * 1000,
  max: 100,
  message: {
    status: "error",
    message:
      "Too many requests from this IP, please try again after 30 minutes",
    retryAfter: "30 minutes",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Authentication Rate Limiter
exports.authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: {
    status: "error",
    message: "Too many authentication attempts from this IP",
    retryAfter: "15 minutes",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Payment Route Rate Limiter

// OTP/EMAIL/SMS Rate Limiter

// File Upload Rate Limiter

// Search Query Rate Limiter

// Admin Route Rate Limiter

// Create Order Rate Limiter

// Review/Rating Rate Limiter

// Forgot Password Rate Limiter

// Advanced Rate Limiter with Redis
