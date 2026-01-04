const Coupon = require("./../../models/couponModel");
const Order = require("./../../models/orderModel");
const catchAsync = require("./../../utils/constants/catchAsync");

// Only Admin can create Coupons
exports.createCoupon = catchAsync(async (req, res) => {
  try {
    const {
      code,
      description,
      discountType,
      discountValue,
      minPurchaseAmount,
      maxDiscountAmount,
      validFrom,
      validUntil,
      usageLimit,
      perUserLimit,
      applicableCategories,
      applicableProducts,
      excludedProducts,
    } = req.body;

    // Validate dates
    if (new Date(validFrom) >= new Date(validUntil)) {
      return res.status(400).json({
        success: false,
        message: "Valid from date must be before valid until date",
      });
    }

    // Validate discount value
    if (discountType === "percentage" && discountValue > 100) {
      return res.status(400).json({
        success: false,
        message: "Percentage discount cannot exceed 100%",
      });
    }

    const coupon = await Coupon.create({
      code: code.toUpperCase(),
      description,
      discountType,
      discountValue,
      minPurchaseAmount,
      maxDiscountAmount,
      validFrom,
      validUntil,
      usageLimit,
      perUserLimit,
      applicableCategories,
      applicableProducts,
      excludedProducts,
      createdBy: req.user.id,
    });

    res.status(201).json({
      success: true,
      data: coupon,
      message: "Coupon created successfully",
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
});

// Get all coupons (Admin)
exports.getAllCoupons = catchAsync(async (req, res) => {
  try {
    const { isActive, page = 1, limit = 10 } = req.query;

    const filter = {};
    if (isActive !== undefined) {
      filter.isActive = isActive === "true";
    }

    const coupons = await Coupon.find(filter)
      .populate("createdBy", "name email")
      .populate("applicableCategories", "name")
      .populate("applicableProducts", "name")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Coupon.countDocuments(filter);

    res.status(200).json({
      success: true,
      count: coupons.length,
      total,
      data: coupons,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

exports.getActiveCoupons = catchAsync(async (req, res) => {
  try {
    const now = new Date();

    const coupons = await Coupon.find({
      isActive: true,
      validFrom: { $lte: now },
      validUntil: { $gte: now },
    })
      .select("-usageCount -createdBy")
      .populate("applicableCategories", "name")
      .sort({ discountValue: -1 });

    res.status(200).json({
      success: true,
      count: coupons.length,
      data: coupons,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

exports.validateCoupon = catchAsync(async (req, res) => {
  try {
    const { code, cartTotal, cartItems } = req.body;
    const userId = req.user.id;

    if (!code || !cartTotal) {
      return res.status(400).json({
        success: false,
        message: "Coupon code and cart total are required",
      });
    }

    const coupon = await Coupon.findOne({
      code: code.toUpperCase(),
    }).populate("applicableProducts applicableCategories excludedProducts");

    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: "Invalid coupon code",
      });
    }

    // Check if coupon is active
    if (!coupon.isActive) {
      return res.status(400).json({
        success: false,
        message: "This coupon is no longer active",
      });
    }

    // Check if coupon is expired or not yet valid
    const now = new Date();
    if (now < coupon.validFrom) {
      return res.status(400).json({
        success: false,
        message: `This coupon is not yet valid. Valid from ${coupon.validFrom.toLocaleDateString()}`,
      });
    }

    if (now > coupon.validUntil) {
      return res.status(400).json({
        success: false,
        message: "This coupon has expired",
      });
    }

    // Check usage limit
    if (!coupon.hasUsageLeft()) {
      return res.status(400).json({
        success: false,
        message: "This coupon has reached its usage limit",
      });
    }

    // Check per-user limit
    const userUsageCount = await Order.countDocuments({
      user: userId,
      "coupon.code": code.toUpperCase(),
    });

    if (userUsageCount >= coupon.perUserLimit) {
      return res.status(400).json({
        success: false,
        message: `You have already used this coupon ${coupon.perUserLimit} time(s)`,
      });
    }

    // Check minimum purchase amount
    if (cartTotal < coupon.minPurchaseAmount) {
      return res.status(400).json({
        success: false,
        message: `Minimum purchase amount of $${coupon.minPurchaseAmount} required`,
      });
    }

    // Check product/category restrictions if provided
    if (cartItems && cartItems.length > 0) {
      // Check if coupon applies to specific products
      if (coupon.applicableProducts.length > 0) {
        const applicableProductIds = coupon.applicableProducts.map((p) =>
          p._id.toString()
        );
        const hasApplicableProduct = cartItems.some((item) =>
          applicableProductIds.includes(item.product.toString())
        );

        if (!hasApplicableProduct) {
          return res.status(400).json({
            success: false,
            message: "This coupon is not applicable to items in your cart",
          });
        }
      }

      // Check if cart contains excluded products
      if (coupon.excludedProducts.length > 0) {
        const excludedProductIds = coupon.excludedProducts.map((p) =>
          p._id.toString()
        );
        const hasExcludedProduct = cartItems.some((item) =>
          excludedProductIds.includes(item.product.toString())
        );

        if (hasExcludedProduct) {
          return res.status(400).json({
            success: false,
            message: "This coupon cannot be applied to some items in your cart",
          });
        }
      }
    }

    // Calculate discount
    const discountAmount = coupon.calculateDiscount(cartTotal);
    const finalAmount = cartTotal - discountAmount;

    res.status(200).json({
      success: true,
      data: {
        coupon: {
          code: coupon.code,
          description: coupon.description,
          discountType: coupon.discountType,
          discountValue: coupon.discountValue,
        },
        cartTotal,
        discountAmount,
        finalAmount,
      },
      message: "Coupon applied successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

exports.updateCoupon = catchAsync(async (req, res) => {
  try {
    const coupon = await Coupon.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: "Coupon not found",
      });
    }

    res.status(200).json({
      success: true,
      data: coupon,
      message: "Coupon updated successfully",
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
});

exports.deleteCoupon = catchAsync(async (req, res) => {
  try {
    const coupon = await Coupon.findByIdAndDelete(req.params.id);

    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: "Coupon not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Coupon deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

exports.toggleCouponStatus = catchAsync(async (req, res) => {
  try {
    const coupon = await Coupon.findById(req.params.id);

    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: "Coupon not found",
      });
    }

    coupon.isActive = !coupon.isActive;
    await coupon.save();

    res.status(200).json({
      success: true,
      data: coupon,
      message: `Coupon ${
        coupon.isActive ? "activated" : "deactivated"
      } successfully`,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});
