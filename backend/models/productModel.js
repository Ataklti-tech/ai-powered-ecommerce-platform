const { LucideThumbsUp } = require("lucide-react");
const mongoose = require("mongoose");
const validator = require("validator");

const productSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Product name is required"],
      trim: true,
      maxlength: [200, "Product name cannot exceed 200 characters "],
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      index: true,
    },
    description: {
      type: String,
      required: [true, "Product description is required"],
      maxlength: [5000, "Description must not exceed 5000 characters"],
    },
    shortDescription: {
      type: String,
      maxlength: [500, "Short description cannot exceed 500 characters"],
    },
    // Reference: Category
    category: {
      type: Schema.Types.ObjectId,
      ref: "Category",
      required: [true, "Category is required"],
      index: true,
    },
    // Pricing
    price: {
      type: Number,
      required: [true, "Price is required"],
      min: [0, "Price cannot be negative"],
    },
    // compareAtPrice
    discount: {
      type: Number,
      min: [0, "Discount cannot be negative"],
      max: [100, "Discount cannot exceed 100%"],
      default: 0,
    },
    costPrice: {
      type: Number,
      min: [0, "Cost price cannot be negative"],
    },
    // sku
    // barcode
    stock: {
      type: Number,
      required: [true, "Stock quantity is required"],
      min: [0, "Stock cannot be negative"],
      default: 0,
    },
    lowStockThreshold: {
      type: Number,
      default: 10,
    },
    images: [
      {
        url: {
          type: String,
          required: true,
          validate: {
            validator: (url) => validator.isURL(url),
            message: "Invalid image URL",
          },
        },
        alt: { type: String, default: "Product image" },
        isPrimary: {
          type: Boolean,
          default: false,
        },
        uploadedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    video: {
      url: String,
      duration: Number,
      thumbnail: String,
    },
    // Specifications (Embedded)
    specifications: [
      {
        name: {
          type: String,
          required: true,
        },
        value: {
          type: String,
          required: true,
        },
      },
    ],
    // Variants (Embedded)
    variants: [
      {
        name: {
          type: String,
          required: true,
        },
        options: [
          {
            value: String,
            priceModifier: {
              type: Number,
              default: 0,
            },
            stockAdjustment: {
              type: Number,
              default: 0,
            },
          },
        ],
      },
    ],
    // Brand and Manufacturer
    brand: {
      type: String,
      trim: true,
      index: true,
    },
    manufacturer: String,
    // Shipping (Embedded)
    Shipping: {
      weight: {
        value: Number,
        unit: { type: String, default: "kg" },
      },
      dimensions: {
        length: Number,
        width: Number,
        height: Number,
        unit: { type: String, default: "cm" },
      },
      shippingClass: String,
      shippingCost: Number,
      freeShippingThreshold: Number,
    },

    // Ratings (Embedded - calculated from reviews)
    rating: {
      average: {
        type: Number,
        default: 0,
        min: [1, "Rating must be above 1.0"],
        max: [5, "Rating must be below 5.0"],
      },
      count: {
        type: Number,
        default: 0,
      },
      distribution: {
        5: { type: Number, default: 0 },
        4: { type: Number, default: 0 },
        3: { type: Number, default: 0 },
        2: { type: Number, default: 0 },
        1: { type: Number, default: 0 },
      },
    },
    // Analytics (Embedded - for AI recommendation)
    analytics: {
      views: {
        type: Number,
        default: 0,
      },
      clicks: { type: Number, default: 0 },
      purchases: { type: Number, default: 0 },
      addToCarts: { type: Number, default: 0 },
      wishlistAdds: { type: Number, default: 0 },
      conversionRate: { type: Number, default: 0 },
      lastViewedAt: Date,
      lastPurchasedAt: Date,
    },
    // Status & Visibility
    status: {
      type: String,
      enum: ["draft", "active", "inactive", "out_of_stock"],
      default: "draft",
      index: true,
    },
    isFeatured: {
      type: Boolean,
      default: false,
      index: true,
    },
    isNewArrival: {
      type: Boolean,
      default: false,
    },
    isBestseller: {
      type: Boolean,
      default: false,
    },
    isOnSale: {
      type: Boolean,
      default: false,
      index: true,
    },
    publishedAt: {
      type: Date,
      index: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes
// Virtuals

// Virtual: Discounted price
productSchema.virtual("discountedPrice").get(function () {
  if (this.discount) {
    return (this.price * (1 - this.discount / 100)).toFixed(2);
  }
  return this.price;
});

// Virtual: Discount Amount
productSchema.virtual("discountAmount").get(function () {
  if (this.discount) {
    return (this.price * (this.discount / 100)).toFixed(2);
  }
  return 0;
});

// Virtual: Savings Percentage
productSchema.virtual("savingsPercentage").get(function () {
  if (this.compareAtPrice && this.compareAtPrice > this.price) {
    const savings =
      ((this.compareAtPrice - this.price) / this.compareAtPrice) * 100;
    return savings.toFixed(2);
  }
  return 0;
});

// Virtual: Is In Stock
productSchema.virtual("isInStock").get(function () {
  return this.stock > 0 && this.status !== "out_of_stock";
});

// Virtual: Is Low Stock
productSchema.virtual("isLowStock").get(function () {
  return this.stock > 0 && this.stock <= this.lowStockThreshold;
});

// Virtual: Average Review Length
productSchema.virtual("avgReviewLength").get(function () {
  return this.rating.count > 0 ? "Has reviews" : "No reviews yet";
});

// Virtual: Product URL slug
productSchema.virtual("productUrl").get(function () {
  return `/products/${this.slug}`;
});

// Virtual: Primary Image
productSchema.virtual("primaryImage").get(function () {
  return this.images.find((img) => img.isPrimary) || this.images[0];
});

// Virtual: Profit Margin
productSchema.virtual("profitMargin").get(function () {
  if (this.costPrice) {
    const profit = ((this.price - this.costPrice) / this.price) * 100;
    return profit.toFixed(2);
  }
  return null;
});

// Virtual: Is Hot Product (recommendation score)
productSchema.virtual("isHotProduct").get(function () {
  return this.analytics.purchases > 50 || this.analytics.views > 500;
});

// HOOKS (MIDDLEWARE)

// Pre-save: Generate slug from name if not provided
productSchema.pre("save", function (next) {
  if (!this.slug && this.name) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^\w\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-");
  }
  next();
});

// Pre-save: Update status based on stock
productSchema.pre("save", function (next) {
  if (this.stock === 0) {
    this.status = "out_of_stock";
  }
  next();
});

// Pre-save: Calculate conversion rate
productSchema.pre("save", function (next) {
  if (this.analytics.views > 0) {
    this.analytics.conversionRate =
      (this.analytics.purchases / this.analytics.views) * 100;
  }
  next();
});

// Pre-save: Ensure only one primary image
productSchema.pre("save", function (next) {
  const primaryCount = this.images.filter((img) => img.isPrimary).length;
  if (primaryCount > 1) {
    this.images.forEach((img, index) => {
      img.isPrimary = index === 0;
    });
  }
  next();
});

// INSTANCE METHODS

// Check if product is in stock
productSchema.methods.checkStock = function (quantity = 1) {
  return this.stock >= quantity;
};

// Update product analytics
productSchema.methods.updateAnalytics = function (action, quantity = 1) {
  const actions = {
    view: () => {
      this.analytics.views += 1;
      this.analytics.lastViewedAt = new Date();
    },
    click: () => {
      this.analytics.clicks += 1;
    },
    addToCart: () => {
      this.analytics.addToCarts += quantity;
    },
    purchase: () => {
      this.analytics.purchases += quantity;
      this.analytics.lastPurchasedAt = new Date();
    },
    wishlist: () => {
      this.analytics.wishlistAdds += 1;
    },
  };

  if (actions[action]) {
    actions[action]();
    this.analytics.conversionRate =
      (this.analytics.purchases / this.analytics.views) * 100;
  }

  return this;
};

// Reduce stock after purchase
productSchema.methods.reduceStock = async function (quantity) {
  if (!this.checkStock(quantity)) {
    throw new Error(`Insufficient stock. Available: ${this.stock}`);
  }
  this.stock -= quantity;
  return await this.save();
};

// Restore stock (for cancelled orders)
productSchema.methods.restoreStock = async function (quantity) {
  this.stock += quantity;
  this.analytics.purchases = Math.max(0, this.analytics.purchases - quantity);
  return await this.save();
};

// Get product with reviews
productSchema.methods.getProductWithReviews = async function () {
  await this.populate({
    path: "reviews",
    model: "Review",
    options: { limit: 10, sort: { createdAt: -1 } },
  });
  return this;
};

// Format product for API response
productSchema.methods.toAPI = function () {
  return {
    id: this._id,
    name: this.name,
    slug: this.slug,
    description: this.shortDescription || this.description,
    price: this.price,
    discountedPrice: this.discountedPrice,
    discount: this.discount,
    image: this.primaryImage,
    rating: this.rating.average,
    ratingCount: this.rating.count,
    isInStock: this.isInStock,
    isFeatured: this.isFeatured,
    isBestseller: this.isBestseller,
    isOnSale: this.isOnSale,
  };
};

// STATIC METHODS

// Get featured products
productSchema.statics.getFeatured = function (limit = 10) {
  return this.find({ isFeatured: true, status: "active" })
    .sort({ createdAt: -1 })
    .limit(limit);
};

// Get bestsellers
productSchema.statics.getBestsellers = function (limit = 10) {
  return this.find({ isBestseller: true, status: "active" })
    .sort({ "analytics.purchases": -1 })
    .limit(limit);
};

// Get new arrivals
productSchema.statics.getNewArrivals = function (limit = 10, days = 30) {
  const date = new Date();
  date.setDate(date.getDate() - days);

  return this.find({
    isNewArrival: true,
    status: "active",
    createdAt: { $gte: date },
  })
    .sort({ createdAt: -1 })
    .limit(limit);
};

// Get products on sale
productSchema.statics.getOnSale = function (limit = 10) {
  return this.find({ isOnSale: true, discount: { $gt: 0 }, status: "active" })
    .sort({ discount: -1 })
    .limit(limit);
};

// Search products
productSchema.statics.searchProducts = function (searchTerm, filters = {}) {
  let query = this.find(
    { $text: { $search: searchTerm }, status: "active" },
    { score: { $meta: "textScore" } }
  );

  if (filters.minPrice) {
    query = query.where("price").gte(filters.minPrice);
  }
  if (filters.maxPrice) {
    query = query.where("price").lte(filters.maxPrice);
  }
  if (filters.category) {
    query = query.where("category").equals(filters.category);
  }
  if (filters.brand) {
    query = query.where("brand").equals(filters.brand);
  }
  if (filters.minRating) {
    query = query.where("rating.average").gte(filters.minRating);
  }

  return query.sort({ score: { $meta: "textScore" } });
};

// Get trending products (most viewed)
productSchema.statics.getTrending = function (limit = 10, days = 7) {
  const date = new Date();
  date.setDate(date.getDate() - days);

  return this.find({
    status: "active",
    "analytics.lastViewedAt": { $gte: date },
  })
    .sort({ "analytics.views": -1 })
    .limit(limit);
};

// Get related products
productSchema.statics.getRelatedProducts = function (productId, limit = 5) {
  return this.findById(productId).then((product) => {
    if (!product) return [];

    return this.find({
      _id: { $ne: productId },
      category: product.category,
      status: "active",
    }).limit(limit);
  });
};

// Get products by category with pagination
productSchema.statics.getByCategory = function (
  categoryId,
  page = 1,
  limit = 12
) {
  const skip = (page - 1) * limit;

  return this.find({ category: categoryId, status: "active" })
    .skip(skip)
    .limit(limit)
    .sort({ createdAt: -1 });
};

// Get low stock products (for admin)
productSchema.statics.getLowStockProducts = function () {
  return this.find({
    $expr: { $lte: ["$stock", "$lowStockThreshold"] },
    status: { $ne: "out_of_stock" },
  });
};

const Product = mongoose.model("Product", productSchema);
module.exports = Product;
