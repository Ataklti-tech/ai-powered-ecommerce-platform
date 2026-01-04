const express = require("express");
const router = express.Router();
const userActivityController = require("./../../controllers/analytics/userActivityController");
const { protect, restrictTo } = require("./../../middleware/auth/authenticate");

router.get("/my-activities", userActivityController.getUserActivities);

router.get("/my-stats", userActivityController.getUserActivityStats);

// called from frontend
// router.post("/track/click", userActivityController.trackProductClick);

router.get(
  "/export",
  restrictTo("admin"),
  userActivityController.exportActivityData
);

module.exports = router;
