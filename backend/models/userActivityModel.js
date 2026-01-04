const mongoose = require("mongoose");

const userActivitySchema = mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
      required: true,
    },
    product: {
      type: mongoose.Schema.ObjectId,
      ref: "Product",
      required: true,
    },
    activityType: {
      type: String,
      enum: [
        "view",
        "click",
        "add_to_cart",
        "purchase",
        "wishlist_add",
        "review",
        "search",
      ],
      required: true,
    },
    duration: Number,
    // metadata,
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

const UserActivity = mongoose.model("UserActivity", userActivitySchema);
module.exports = UserActivity;
