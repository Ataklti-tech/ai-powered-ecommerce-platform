const mongoose = require("mongoose");
const validator = require("validator");

const reviewSchema = mongoose.Schema({
  product: {
    type: mongoose.Schema.ObjectId,
    ref: "Product",
    required: true,
  },
  user: {
    type: mongoose.Schema.ObjectId,
    ref: "User",
    required: true,
  },
  order: {
    type: mongoose.Schema.ObjectId,
    ref: "Order",
  },
  rating: {
    type: Number,
    required: [true, "Rating is required"],
    min: [1, "Rating must be at least 1"],
    max: [5, "Rating cannot exceed 5"],
  },
  title: {
    type: String,
    required: [true, "Review title is required"],
    maxlength: [200, "Title cannot exceed 200 characters"],
  },
  comment: {
    type: String,
    required: [true, "Review comment is required"],
    maxlength: [3000, "Comment cannot exceed 3000 characters"],
  },

  // timestamps: true,
});

const Review = mongoose.model("Review", reviewSchema);
module.exports = Review;
