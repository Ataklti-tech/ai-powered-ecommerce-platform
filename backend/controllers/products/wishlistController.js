// const wishList = require("./../../models/wishListModel");
const User = require("./../../models/userModel");
const Cart = require("./../../models/cartModel");
const catchAsync = require("./../../utils/constants/catchAsync");
const Product = require("./../../models/productModel");
const AppError = require("./../../utils/constants/appError");
const Wishlist = require("./../../models/wishListModel");
const { trackActivity } = require("../analytics/userActivityController");

// add product to wishlist
exports.addProductToWishlist = catchAsync(async (req, res, next) => {
  const { productId } = req.body;
  const userId = req.user.id;

  // validate input
  if (!productId) {
    return next(new AppError("Product ID is required", 400));
  }

  // Check if product exists
  const product = await Product.findById(productId);
  if (!product) {
    return next(new AppError("Product not found", 404));
  }

  // V1 - Codes
  // Get user
  // const user = await User.findById(userId);
  // if (!user) {
  //   return next(new AppError("User not found", 404));
  // }

  // // Check if product already in wishlist
  // if (user.wishList && user.wishList.includes(productId)) {
  //   return next(new AppError("Product already in wishlist", 400));
  // }

  // // Add to wishlist
  // if (!user.wishList) {
  //   user.wishList = [];
  // }
  // user.wishList.push(productId);
  // await user.save();

  // // Track analytics
  // product.updateAnalytics("wishlist");
  // await product.save();

  // Populate wishlist with product details
  // await user.populate("wishList", "name price image discount");

  // V2 - Codes
  let wishlist = await Wishlist.findOne({ user: userId });
  if (!wishlist) {
    wishlist = await Wishlist.create({
      user: userId,
      items: [],
    });
  }

  // Check if already in wishlist
  const exists = wishlist.items.some(
    (item) => item.product.toString() === productId
  );

  if (exists) {
    return next(new AppError("Product already in wishlist", 400));
  }

  wishlist.items.push({
    product: productId,
    priceAtAddition: product.price,
  });

  wishlist.totalItems = wishlist.items.length;
  await wishlist.save();

  // Analytics (safe)
  product.updateAnalytics("wishlist");

  // tracking wishlist add activity
  trackActivity(userId, productId, "wishlist_add");
  await product.save();

  res.status(201).json({
    success: true,
    message: "Product added to wishlist successfully",
    wishlistCount: wishlist.totalItems,
    data: wishlist,
  });
});

// remove product from wishlist
// user removes a product from their wishlist
exports.removeProductFromWishlist = catchAsync(async (req, res, next) => {
  const { productId } = req.params;
  const userId = req.user.id;

  if (!productId) {
    return next(new AppError("Product ID is required", 400));
  }

  // Get user
  const user = await User.findById(userId);
  if (!user) {
    return next(new AppError("User not found", 404));
  }

  // Check if product in wishlist
  const wishlistIndex = user.wishlist.findIndex(
    (id) => id.toString() === productId
  );

  if (wishlistIndex === -1) {
    return next(new AppError("Product not found in wishlist", 404));
  }

  // Remove from wishlist
  user.wishlist.splice(wishlistIndex, 1);
  await user.save();

  // Populate and return
  await user.populate("wishlist", "name price image");

  res.status(200).json({
    success: true,
    message: "Product removed from wishlist successfully",
    wishlistCount: user.wishlist.length,
    data: user.wishlist,
  });
});

// get user wishlist
// get all products in user's wishlist
exports.getWishlist = catchAsync(async (req, res, next) => {
  const userId = req.user.id;
  // apifeatures will be used later

  // get user with populated wishlist
  // const user = await User.findById(userId).populate({
  //   path: "wishlist",
  //   select: "name price discount image isInStock stock rating",
  // });

  // if (!user) {
  //   return next(new AppError("User not found", 404));
  // }

  // // Get total count
  // const totalItems = user.wishlist ? user.wishlist.length : 0;

  // // Get full wishlist for counting (without pagination)
  // const fullUser = await User.findById(userId);
  // const totalWishlistItems = fullUser.wishlist ? fullUser.wishlist.length : 0;

  // ///////////////////////
  // V2 - Codes
  const wishlist = await Wishlist.findOne({ user: userId }).populate({
    path: "items.product",
    select: "name price discount images isInStock stock rating",
  });

  if (!wishlist) {
    return res.status(200).json({
      success: true,
      totalItems: 0,
      data: [],
    });
  }
  // ////////////////////
  res.status(200).json({
    success: true,
    totalItems: wishlist.items.length,
    // count: user.wishlist ? user.wishlist.length : 0,
    // totalItems: totalWishlistItems,
    data: wishlist.items || [],
  });
});

// check if product is in wishlist
exports.checkWishlistStatus = catchAsync(async (req, res, next) => {
  const { productId } = req.params;
  const userId = req.user.id;

  if (!productId) {
    return next(new AppError("Product ID is required", 400));
  }

  // Get user
  const user = await User.findById(userId);

  if (!user) {
    return next(new AppError("User not found", 404));
  }

  // Check if in wishlist
  const isInWishlist = user.wishlist && user.wishlist.includes(productId);

  res.status(200).json({
    success: true,
    productId,
    isInWishlist,
  });
});

// clear entire wishlist / remove all products from wishlist
exports.clearWishlist = catchAsync(async (req, res, next) => {
  const userId = req.user.id;

  const user = await User.findById(userId);

  if (!user) {
    return next(new AppError("User not found", 404));
  }

  if (!user.wishlist || user.wishlist.length === 0) {
    return next(new AppError("Wishlist is already empty", 400));
  }

  user.wishlist = [];
  await user.save();

  res.status(200).json({
    success: true,
    message: "Wishlist cleared successfully",
    wishlistCount: 0,
    data: [],
  });
});

// get wishlist count / number of items in wishlist
exports.getWishlistCount = catchAsync(async (req, res, next) => {
  const userId = req.user.id;

  const user = await User.findById(userId);

  if (!user) {
    return next(new AppError("User not found", 404));
  }

  const count = user.wishlist ? user.wishlist.length : 0;

  res.status(200).json({
    success: true,
    wishlistCount: count,
  });
});

// move item from wishlist to cart
exports.moveToCart = catchAsync(async (req, res, next) => {
  const { productId } = req.params;
  const { quantity } = req.body;
  const userId = req.user.id;

  if (!productId) {
    return next(new AppError("Product ID is required", 400));
  }

  const qty = quantity || 1;

  // Check if product exists
  const product = await Product.findById(productId);
  if (!product) {
    return next(new AppError("Product not found", 404));
  }

  // Check stock
  if (product.stock < qty) {
    return next(
      new AppError(`Insufficient stock. Available: ${product.stock}`, 400)
    );
  }

  // Get user
  const user = await User.findById(userId);
  if (!user) {
    return next(new AppError("User not found", 404));
  }

  // Check if in wishlist
  const wishlistIndex = user.wishlist.findIndex(
    (id) => id.toString() === productId
  );

  if (wishlistIndex === -1) {
    return next(new AppError("Product not found in wishlist", 404));
  }

  // Remove from wishlist
  user.wishlist.splice(wishlistIndex, 1);
  await user.save();

  // Add to cart
  let cart = await Cart.findOne({ user: userId });

  if (!cart) {
    cart = await Cart.create({
      user: userId,
      items: [{ product: productId, quantity: qty }],
      totalItems: qty,
      totalPrice: product.price * qty,
    });
  } else {
    // Check if already in cart
    const cartItemIndex = cart.items.findIndex(
      (item) => item.product.toString() === productId
    );

    if (cartItemIndex > -1) {
      cart.items[cartItemIndex].quantity += qty;
    } else {
      cart.items.push({ product: productId, quantity: qty });
    }

    // Recalculate cart totals
    let totalItems = 0;
    let totalPrice = 0;

    for (let item of cart.items) {
      const prod = await Product.findById(item.product);
      if (prod) {
        totalItems += item.quantity;
        totalPrice += prod.price * item.quantity;
      }
    }

    cart.totalItems = totalItems;
    cart.totalPrice = totalPrice;
  }

  await cart.save();

  res.status(200).json({
    success: true,
    message: "Product moved to cart successfully",
    wishlistCount: user.wishlist.length,
    cartCount: cart.totalItems,
  });
});

// get wishlist with product details
exports.getWishlistWithDetails = catchAsync(async (req, res, next) => {
  const userId = req.user.id;

  const user = await User.findById(userId).populate({
    path: "wishlist",
    select:
      "name price discount description image isInStock stock rating brand",
  });

  if (!user) {
    return next(new AppError("User not found", 404));
  }

  // Calculate savings for each item
  const wishlistWithSavings = user.wishlist.map((product) => ({
    ...(product.toObject ? product.toObject() : product),
    discountedPrice: (
      product.price *
      (1 - (product.discount || 0) / 100)
    ).toFixed(2),
    savings: (product.price * ((product.discount || 0) / 100)).toFixed(2),
  }));

  res.status(200).json({
    success: true,
    count: user.wishlist.length,
    data: wishlistWithSavings,
  });
});

// add multiple products to wishlist
exports.addMultipleProductsToWishlist = catchAsync(async (req, res, next) => {
  const { productIds } = req.body;
  const userId = req.user.id;

  if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
    return next(new AppError("Product IDs array is required", 400));
  }

  // Validate max 50 items at once
  if (productIds.length > 50) {
    return next(new AppError("Cannot add more than 50 items at once", 400));
  }

  const user = await User.findById(userId);
  if (!user) {
    return next(new AppError("User not found", 404));
  }

  const addedItems = [];
  const failedItems = [];

  for (let productId of productIds) {
    // Check if product exists
    const product = await Product.findById(productId);

    if (!product) {
      failedItems.push({ productId, reason: "Product not found" });
      continue;
    }

    // Check if already in wishlist
    if (user.wishlist && user.wishlist.includes(productId)) {
      failedItems.push({ productId, reason: "Already in wishlist" });
      continue;
    }

    // Add to wishlist
    if (!user.wishlist) {
      user.wishlist = [];
    }
    user.wishlist.push(productId);
    addedItems.push(productId);
  }

  if (addedItems.length > 0) {
    await user.save();
  }

  res.status(200).json({
    success: addedItems.length > 0,
    message: `${addedItems.length} items added, ${failedItems.length} failed`,
    addedCount: addedItems.length,
    failedCount: failedItems.length,
    addedItems,
    failedItems,
    wishlistCount: user.wishlist ? user.wishlist.length : 0,
  });
});

// remove multiple products from wishlist
exports.removeMultipleProductsFromWishlist = catchAsync(
  async (req, res, next) => {
    const { productIds } = req.body;
    const userId = req.user.id;

    if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
      return next(new AppError("Product IDs array is required", 400));
    }

    const user = await User.findById(userId);
    if (!user) {
      return next(new AppError("User not found", 404));
    }

    const removedItems = [];
    const failedItems = [];

    for (let productId of productIds) {
      const wishlistIndex = user.wishlist.findIndex(
        (id) => id.toString() === productId
      );

      if (wishlistIndex === -1) {
        failedItems.push({ productId, reason: "Not in wishlist" });
        continue;
      }

      user.wishlist.splice(wishlistIndex, 1);
      removedItems.push(productId);
    }

    if (removedItems.length > 0) {
      await user.save();
    }

    res.status(200).json({
      success: removedItems.length > 0,
      message: `${removedItems.length} items removed`,
      removedCount: removedItems.length,
      failedCount: failedItems.length,
      removedItems,
      failedItems,
      wishlistCount: user.wishlist.length,
    });
  }
);

// share wishlist
// sharing wishlist with friends via email

// get wishlist statistics
exports.getWishlistStatistics = catchAsync(async (req, res, next) => {
  const userId = req.user.id;

  const user = await User.findById(userId).populate(
    "wishlist",
    "price discount category"
  );

  if (!user) {
    return next(new AppError("User not found", 404));
  }

  const wishlist = user.wishlist || [];
  const totalItems = wishlist.length;

  if (totalItems === 0) {
    return res.status(200).json({
      success: true,
      data: {
        totalItems: 0,
        totalValue: 0,
        averagePrice: 0,
        priceRange: { min: 0, max: 0 },
        categories: [],
      },
    });
  }

  // Calculate statistics
  const prices = wishlist.map((p) => p.price);
  const totalValue = prices.reduce((a, b) => a + b, 0);
  const averagePrice = (totalValue / totalItems).toFixed(2);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);

  // Group by category
  const categories = {};
  wishlist.forEach((product) => {
    const cat = product.category || "Uncategorized";
    categories[cat] = (categories[cat] || 0) + 1;
  });

  res.status(200).json({
    success: true,
    data: {
      totalItems,
      totalValue: totalValue.toFixed(2),
      averagePrice,
      priceRange: { min: minPrice, max: maxPrice },
      categories,
    },
  });
});

// get wishlist recommendation
exports.getWishlistRecommendations = catchAsync(async (req, res, next) => {
  const userId = req.user.id;
  const limit = req.query.limit || 5;

  const user = await User.findById(userId).populate("wishlist", "category");

  if (!user) {
    return next(new AppError("User not found", 404));
  }

  // Get categories from wishlist
  const categories = [
    ...new Set(user.wishlist.map((p) => p.category).filter(Boolean)),
  ];

  if (categories.length === 0) {
    return res.status(200).json({
      success: true,
      data: [],
    });
  }

  // Find similar products not in wishlist
  const recommendations = await Product.find({
    category: { $in: categories },
    _id: { $nin: user.wishlist },
    status: "active",
  })
    .limit(limit)
    .sort({ "analytics.purchases": -1 });

  res.status(200).json({
    success: true,
    count: recommendations.length,
    data: recommendations,
  });
});

// notify on price drop
exports.notifyPriceDrops = catchAsync(async (req, res, next) => {
  const userId = req.user.id;

  const user = await User.findById(userId).populate("wishlist");

  if (!user) {
    return next(new AppError("User not found", 404));
  }

  const priceDrops = [];

  for (let product of user.wishlist) {
    // Check if product has price drop compared to previous price
    if (product.previousPrice && product.price < product.previousPrice) {
      const savings = (product.previousPrice - product.price).toFixed(2);
      priceDrops.push({
        name: product.name,
        previousPrice: product.previousPrice,
        currentPrice: product.price,
        savings,
        percentageDrop: (
          ((product.previousPrice - product.price) / product.previousPrice) *
          100
        ).toFixed(1),
      });
    }
  }

  if (priceDrops.length > 0) {
    // Send email
    const priceDropsList = priceDrops
      .map(
        (item) =>
          `${item.name}: $${item.previousPrice} → $${item.currentPrice} (Save $${item.savings})`
      )
      .join("\n");

    await sendEmail({
      email: user.email,
      subject: `Price drops on your wishlist items!`,
      message: `Great news! ${priceDrops.length} items on your wishlist have dropped in price:\n\n${priceDropsList}`,
    });
  }

  res.status(200).json({
    success: true,
    priceDropsFound: priceDrops.length,
    data: priceDrops,
  });
});
