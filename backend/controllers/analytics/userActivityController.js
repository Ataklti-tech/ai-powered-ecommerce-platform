const UserActivity = require("./../../models/userActivityModel");
const Product = require("./../../models/productModel");
const catchAsync = require("../../utils/constants/catchAsync");

// tracking activity (will be called from other controllers)
exports.trackActivity = catchAsync(
  async (userId, productId, activityType, metadata) => {
    try {
      const activity = await UserActivity.create({
        user: userId,
        product: productId,
        activityType,
        duration: metadata.duration || null,
        timestamp: new Date(),
      });
      console.log(`Tracked: ${activityType} for user ${userId}`);
      return activity;
    } catch (error) {
      console.log("Activity tracking error: ", error);
      return null;
    }
  }
);

// get user activity history
exports.getUserActivities = catchAsync(async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      activityType,
      startDate,
      endDate,
      page = 1,
      limit = 50,
    } = req.query;

    const filter = { user: userId };

    if (activityType) {
      filter.activityType = activityType;
    }

    if (startDate || endDate) {
      filter.timestamp = {};
      if (startDate) filter.timestamp.$gte = new Date(startDate);
      if (endDate) filter.timestamp.$lte = new Date(endDate);
    }

    const activities = await UserActivity.find(filter)
      .populate("product", "name price image category")
      .sort({ timestamp: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await UserActivity.countDocuments(filter);

    res.status(200).json({
      success: true,
      count: activities.length,
      total,
      data: activities,
    });
  } catch (error) {
    res.status(500).json({
      status: "fail",
      message: error.message,
    });
  }
});

// get activity analytics for user
exports.getUserActivityStats = catchAsync(async (req, res) => {
  try {
    const userId = req.user.id;

    const stats = await UserActivity.aggregate([
      { $match: { user: mongoose.Types.ObjectId(userId) } },
      {
        $group: {
          _id: "$activityType",
          count: { $sum: 1 },
        },
      },
    ]);

    // Get most viewed products
    const mostViewed = await UserActivity.aggregate([
      {
        $match: {
          user: mongoose.Types.ObjectId(userId),
          activityType: "view",
        },
      },
      {
        $group: {
          _id: "$product",
          viewCount: { $sum: 1 },
        },
      },
      { $sort: { viewCount: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: "products",
          localField: "_id",
          foreignField: "_id",
          as: "product",
        },
      },
      { $unwind: "$product" },
    ]);

    res.status(200).json({
      success: true,
      data: {
        activityBreakdown: stats,
        mostViewedProducts: mostViewed,
      },
    });
  } catch (error) {
    res.status(500).json({
      status: "failed",
      message: error.message,
    });
  }
});

// exporting data for ML training
exports.exportActivityData = catchAsync(async (req, res) => {
  try {
    const { startDate, endDate, format = "json" } = req.query;
    const filter = {};
    if (startDate || endDate) {
      filter.timestamp = {};
      if (startDate) filter.timestamp.$gte = new Date(startDate);
      if (endDate) filter.timestamp.$lte = new Date(endDate);
    }
    const activities = await UserActivity.find(filter)
      .populate("user", "id email")
      .populate("product", "id name category price")
      .lean();

    if (format === "csv") {
      // Convert to CSV format for ML
      const csv = convertToCSV(activities);
      res.setHeader("Content-Type", "text/csv");
      res.setHeader(
        "Content-Disposition",
        "attachment; filename=user_activities.csv"
      );
      return res.send(csv);
    }

    res.status(200).json({
      success: true,
      count: activities.length,
      data: activities,
    });
  } catch (error) {
    res.status(500).json({
      status: "fail",
      message: error.message,
    });
  }
});

// function for converting to CSV
function convertToCSV(activities) {
  const header =
    "user_id, product_id, activity_type, category, price, timestamp\n";

  const rows = activities
    .map((a) => {
      return `${a.user._id}, ${a.product._id}, ${a.activityType}, ${a.product.category}, ${a.product.price}, ${a.timestamp}`;
    })
    .join("\n");

  return header + rows;
}
