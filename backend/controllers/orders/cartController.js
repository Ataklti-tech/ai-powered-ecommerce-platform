const Cart = require("./../../models/cartModel");
const User = require("./../../models/userModel");
const Product = require("./../../models/productModel");
const catchAsync = require("./../../utils/constants/catchAsync");
const AppError = require("./../../utils/constants/appError");
const { Cat } = require("lucide-react");

// Adding product to cart
exports.addProductToCart = catchAsync(async (req, res, next) => {
  const { productId, quantity } = req.body;
  const userId = req.user.id;

  // Validate
  if (!productId) {
    return next(new AppError("Product id is required", 400));
  }
  // Check quantity
  if (!quantity || quantity < 1) {
    return next(new AppError("Quantity must be at least 1", 400));
  }
  // Check if product exists
  const product = await Product.findById(productId);
  if (!product) {
    return next(new AppError("Product not found", 404));
  }
  // Check if product has sufficient stock
  if (!product.stock < quantity) {
    return next(
      new AppError(`Insufficient stock. Available: ${product.stock}`, 400)
    );
  }
  // Check if product is in stock
  if (product.isInStock) {
    return next(new AppError("This product is out of stock", 400));
  }

  // Find or create cart for user
  let cart = await Cart.findOne({ user: userId });
  if (!cart) {
    cart = await Cart.create({
      user: userId,
      items: [{ product: productId, quantity }],
      totalItems: 1,
      totalPrice: product.price * quantity,
    });
  } else {
    // Check if product is already in the cart
    const itemIndex = cart.items.findIndex(
      (item) => item.product.toString() === productId
    );
    if (itemIndex > -1) {
      // Product is already in the cart - update quantity
      const newQuantity = cart.items[itemIndex].quantity + quantity;
      if (product.stock < newQuantity) {
        return next(
          new AppError(
            `Insufficient stock. Maximum available: ${product.stock}`,
            400
          )
        );
      }
      cart.items[itemIndex].quantity = newQuantity;
      cart.items[itemIndex].addedAt = new Date();
    } else {
      // Add new item to the cart
      cart.items.push({
        product: productId,
        quantity,
        addedAt: new Date(),
      });
    }
  }

  // Recalculating the total amount
  await calculateCartTotals(cart);
  await cart.save();

  // Populate and return cart
  await cart.populate({
    path: "items.product",
    select: "name price discount description images stock",
  });

  res.status(201).json({
    success: true,
    message: "Product added to cart successfully",
    data: cart,
  });
});

// Getting user cart
exports.getCart = catchAsync(async (req, res, next) => {
  const userId = req.user.id;

  let cart = await Cart.findOne({ user: userId }).populate({
    path: "items.product",
    select: "name price discount description images stock",
  });

  if (!cart) {
    // create an empty cart if it doesn't exist
    cart = await Cart.create({
      user: userId,
      items: [],
      totalItems: 0,
      totalPrice: 0,
    });

    res.status(200).json({
      success: true,
      data: cart,
    });
  }
});
exports.updateCartItem = catchAsync(async (req, res, next) => {
  const { productId, quantity } = req.body;
  const userId = req.user.id;

  if (!productId) {
    return next(new AppError("Product ID is required", 400));
  }
  if (quantity < 0) {
    return next(new AppError("Quantity cannot be negative", 400));
  }
  // Check if product exists
  const product = await Product.findById(productId);
  if (!product) {
    return next(new AppError("Product not found", 404));
  }
  // check stock
  if (product.stock < quantity) {
    return next(
      new AppError(`Insufficient stock. Available: ${product.stock}`, 400)
    );
  }
  // find cart
  const cart = await Cart.findOne({ user: userId });
  if (!cart) {
    return next(new AppError("Cart not found", 404));
  }
  // find product in cart
  const itemIndex = cart.items.findIndex(
    (item) => item.product.toString() === productId
  );
  if (itemIndex === -1) {
    return next(new AppError("Product not found in cart", 404));
  }

  // if quantity is 0, remove item
  if (quantity === 0) {
    cart.items.splice(itemIndex, 1);
  } else {
    cart.items[itemIndex].quantity = quantity;
    cart.items[itemIndex].addedAt = new Date();
  }

  // recalculate totals
  await calculateCartTotals(cart);
  await cart.save();

  // populate and return
  await cart.populate({
    path: "items.product",
    select: "name price discount description images stock",
  });

  res.status(200).json({
    success: true,
    message: "Cart updated successfully",
    data: cart,
  });
});

exports.removeItem = catchAsync(async (req, res, next) => {
  const { productId } = req.params;
  const userId = req.user.id;
  if (!productId) {
    return next(new AppError("Product Id is required", 400));
  }
  // find cart
  const cart = await Cart.findOne({ user: userId });
  if (!cart) {
    return next(new AppError("Cart not found", 404));
  }
  // find and remove product
  const itemIndex = cart.items.findIndex(
    (item) => item.product.toString() === productId
  );

  if (itemIndex === -1) {
    return next(new AppError("Product not found in cart", 404));
  }

  cart.items.splice(itemIndex, 1);

  // Recalculate totals
  await calculateCartTotals(cart);
  await cart.save();

  // Populate and return
  await cart.populate({
    path: "items.product",
    select: "name price discount description images stock",
  });

  res.status(200).json({
    success: true,
    message: "Product removed from cart successfully",
    data: cart,
  });
});

// removing or deleting the whole cart
exports.deleteCart = catchAsync(async (req, res, next) => {
  const userId = req.user.id;
  const cart = await Cart.findOne({ user: userId });
  if (!cart) {
    return next(new AppError("Cart not found", 404));
  }

  cart.items = [];
  cart.totalItems = 0;
  cart.totalPrice = 0;
  cart.lastUpdated = new Date();

  await cart.save();

  res.status(200).json({
    success: true,
    message: "Cart cleared successfully",
    data: cart,
  });
});

// get cart count or number of items
exports.getCartItemNumber = catchAsync(async (req, res, next) => {
  const userId = req.user.id;

  const cart = await Cart.findOne({ user: userId });
  const count = cart ? cart.totalItems : 0;

  res.status(200).json({
    success: true,
    cartCount: count,
  });
});

// validate cart
exports.validateCart = catchAsync(async (req, res, next) => {
  const userId = req.user.id;
  const cart = await Cart.findOne({ user: userId }).populate({
    path: "items.product",
    select: "stock isInStock status price",
  });

  if (!cart || cart.items.length === 0) {
    return next(new AppError("Cart is empty", 400));
  }

  const validationErrors = [];
  const validItems = [];

  for (let item of cart.items) {
    const product = item.product;
    // Check if product exists
    if (!product) {
      validationErrors.push({
        productId: item.product,
        error: "Product no longer exists",
      });
      continue;
    }

    // Check stock
    if (product.stock < item.quantity) {
      validationErrors.push({
        productId: product._id,
        productName: product.name,
        error: `Insufficient stock. Available: ${product.stock}, Requested: ${item.quantity}`,
      });
      // Keep item but with reduced quantity
      validItems.push({
        ...item.toObject(),
        quantity: Math.min(item.quantity, product.stock),
      });
    } else if (!product.isInStock) {
      validationErrors.push({
        productId: product._id,
        productName: product.name,
        error: "Product is out of stock",
      });
    } else {
      validItems.push(item);
    }
  }

  res.status(200).json({
    success: validationErrors.length === 0,
    message:
      validationErrors.length === 0
        ? "Cart is valid"
        : "Cart has validation issues",
    validationErrors,
    validItems,
    cartValid: validationErrors.length === 0,
  });
});

// ===============================
// applying coupon / discount to the cart
// exports.applyCoupon
// ========================
// get cart summary / data
exports.getCartSummary = catchAsync(async (req, res, next) => {
  const userId = req.user.id;
  const cart = await Cart.findOne({ user: userId }).populate({
    path: "items.product",
    select: "name price discount",
  });

  if (!cart) {
    return res.status(200).json({
      success: true,
      data: {
        subtotal: 0,
        totalDiscount: 0,
        totalTax: 0,
        total: 0,
        itemCount: 0,
      },
    });
  }
  // Calculate totals
  let subtotal = 0;
  let totalDiscount = 0;

  cart.items.forEach((item) => {
    const price = item.product.price;
    const discount = item.product.discount || 0;
    const itemPrice = price * item.quantity;
    const itemDiscount = (itemPrice * discount) / 100;

    subtotal += itemPrice;
    totalDiscount += itemDiscount;
  });

  // Calculate tax (assuming 10%)
  const tax = (subtotal - totalDiscount) * 0.1;
  const total = subtotal - totalDiscount + tax;

  res.status(200).json({
    success: true,
    data: {
      subtotal: subtotal.toFixed(2),
      totalDiscount: totalDiscount.toFixed(2),
      totalTax: tax.toFixed(2),
      total: total.toFixed(2),
      itemCount: cart.totalItems,
      items: cart.items,
    },
  });
});

// Helper function: Calculating cart totals
async function calculateCartTotals(cart) {
  if (cart.items.length === 0) {
    cart.totalItems = 0;
    cart.totalPrice = 0;
    cart.lastUpdated = new Date();
    return;
  }

  let totalItems = 0;
  let totalPrice = 0;

  for (let item of cart.items) {
    const product = await Product.findById(item.product);
    if (product) {
      const itemPrice = product.price * item.quantity;
      totalPrice += itemPrice;
      totalItems += item.quantity;
    }
  }

  cart.totalItems = totalItems;
  cart.totalPrice = totalPrice;
  cart.lastUpdated = new Date();
}
// ==========================
exports.decreaseQuantity;
// ==========================

exports.mergeCarts = catchAsync(async (req, res, next) => {
  const { guestCartItems } = req.body;
});

// deleting / removing cart (admin - remove user's cart)
exports.removeCart = catchAsync(async (req, res, next) => {
  const { userId } = req.params;
  const cart = await Cart.findOneAndDelete({ user: userId });
  if (!cart) {
    return next(new AppError("Cart not found", 404));
  }

  res.status(200).json({
    success: true,
    message: "Cart deleted successfully",
  });
});
