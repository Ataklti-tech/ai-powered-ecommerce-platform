const mongoose = require("mongoose");

const couponSchema = mongoose.Schema(
  {
    code: {
      type: String,
      trim: true,
      required: [true, "Coupon name is required"],
      unique: true,
      uppercase: true,
      minlength: 3,
      maxlength: 10,
    },
    description: {
      type: String,
      required: [true, "Coupon description is required"],
    },
    discountType: {
      type: String,
      enum: ["percentage", "fixed"],
      required: [true, "Discount type is required"],
    },
    discountValue: {
      type: Number,
      required: [true, "Discount value is required"],
      min: 0,
    },
    minPurchaseAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    maxDiscountAmount: {
      type: Number,
      default: null,
    },
    validFrom: {
      type: Date,
      required: [true, "Valid from date is required"],
    },
    validUntil: {
      type: Date,
      required: [true, "Valid until date is required"],
    },
    usageLimit: {
      type: Number,
      default: null,
    },
    usageCount: {
      type: Number,
      default: 0,
    },
    perUserLimit: {
      type: Number,
      default: 1,
    },
    applicableCategories: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Category",
      },
    ],
    applicableProducts: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
      },
    ],
    excludedProducts: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
      },
    ],
    isActive: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);
// Index for faster queries
couponSchema.index({ code: 1 });
couponSchema.index({ validFrom: 1, validUntil: 1 });
couponSchema.index({ isActive: 1 });

// Virtual to check if coupon is expired
couponSchema.virtual("isExpired").get(function () {
  return new Date() > this.validUntil;
});

// Virtual to check if coupon is valid now
couponSchema.virtual("isValidNow").get(function () {
  const now = new Date();
  return now >= this.validFrom && now <= this.validUntil && this.isActive;
});

// Method to check if coupon has usage left
couponSchema.methods.hasUsageLeft = function () {
  if (this.usageLimit === null) return true;
  return this.usageCount < this.usageLimit;
};

// Method to increment usage count
couponSchema.methods.incrementUsage = async function () {
  this.usageCount += 1;
  return await this.save();
};

// Method to calculate discount
couponSchema.methods.calculateDiscount = function (amount) {
  if (this.discountType === "percentage") {
    let discount = (amount * this.discountValue) / 100;

    // Apply max discount limit if set
    if (this.maxDiscountAmount && discount > this.maxDiscountAmount) {
      discount = this.maxDiscountAmount;
    }

    return Math.round(discount * 100) / 100; // Round to 2 decimals
  } else {
    // Fixed discount
    return Math.min(this.discountValue, amount);
  }
};

const Coupon = mongoose.model("Coupon", couponSchema);
module.exports = Coupon;
