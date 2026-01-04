// no model for checkout
const Cart = require("./../../models/cartModel");
const User = require("./../../models/userModel");
const Product = require("./../../models/productModel");
const Order = require("./../../models/orderModel");
const Coupon = require("./../../models/couponModel");
const catchAsync = require("./../../utils/constants/catchAsync");
const sendEmail = require("./../../services/email/emailService");
const AppError = require("./../../utils/constants/appError");

exports.validateCheckOut = catchAsync(async (req, res, next) => {
  const userId = req.user.id;
  // shipping address and coupon code
  const { shippingAddress, couponCode } = req.body;
  // select the cart
  const cart = await Cart.findOne({ user: userId }).populate("items.products");
  if (!cart || cart.item.length === 0) {
    return next(new AppError("Your cart is empty", 400));
  }

  // validate shipping address
  if (!shippingAddress || !shippingAddress.street || !shippingAddress.city) {
    return next(
      new AppError(
        "Complete shipping address is required (street, city, state, postalCode, country)",
        400
      )
    );
  }
  // validate all cart items have stock
  const validationErrors = [];
  for (let item of cart.items) {
    const product = await Product.findById(item.product._id);

    if (!product) {
      validationErrors.push(`Product ${item.product._id} no longer exists`);
    } else if (product.stock < item.quantity) {
      validationErrors.push(
        `${product.name}: Only ${product.stock} available, you want ${item.quantity}`
      );
    }
  }
  if (validationErrors.length > 0) {
    return next(
      new AppError(
        `Stock validation failed: ${validationErrors.join("; ")}`,
        400
      )
    );
  }
  // calculate the totals
  let subtotal = 0;
  let totalDiscount = 0;

  for (let item of cart.items) {
    const product = item.product;
    const itemPrice = product.price * item.quantity;
    const itemDiscount = (itemPrice * (product.discount || 0)) / 100;

    subtotal += itemPrice;
    totalDiscount += itemDiscount;
  }

  const tax = (subtotal - totalDiscount) * 0.1;
  const total = subtotal - totalDiscount + tax;
  // apply coupon
  let couponDiscount = 0;
  let couponApplied = null;

  if (couponCode) {
    const coupon = await Coupon.findOne({
      code: couponCode,
      isActive: true,
    });

    if (coupon && new Date() < coupon.expiryDate) {
      if (coupon.discountType === "percentage") {
        couponDiscount = (total * coupon.discountValue) / 100;
      } else {
        couponDiscount = coupon.discountValue;
      }
      couponDiscount = Math.min(couponDiscount, total);
      couponApplied = coupon._id;
    } else {
      return next(new AppError("Invalid or expired coupon code", 400));
    }
  }

  const finalTotal = total - couponDiscount;
  // return checkout
  res.status(200).json({
    success: true,
    message: "Checkout data validated",
    // This is TEMPORARY data - used only for display
    checkoutData: {
      cartItems: cart.items.length,
      subtotal: subtotal.toFixed(2),
      discount: totalDiscount.toFixed(2),
      tax: tax.toFixed(2),
      couponDiscount: couponDiscount.toFixed(2),
      total: finalTotal.toFixed(2),
      shippingAddress,
      couponCode: couponCode || null,
    },
  });
});
exports.confirmCheckOut = catchAsync(async (req, res, next) => {
  const { shippingAddress, paymentMethod, couponCode, billingAddressSame } =
    req.body;

  const userId = req.user.id;
  console.log("Confirming and Creating Order");

  // get cart
  const cart = await Cart.findOne({ user: userId }).populate("items.product");

  if (!cart || cart.items.length === 0) {
    return next(new AppError("Your cart is empty", 400));
  }

  // validate payment method
  const validPaymentMethods = [
    "credit_card",
    "debit_card",
    "paypal",
    "mobile_money",
  ];
  if (!validPaymentMethods.includes(paymentMethod)) {
    return next(new AppError("Invalid payment method", 400));
  }

  // calculate final amounts
  let subtotal = 0;
  let totalDiscount = 0;
  const orderItems = [];

  for (let item of cart.items) {
    const product = item.product;
    const itemPrice = product.price * item.quantity;
    const itemDiscount = (itemPrice * (product.discount || 0)) / 100;

    subtotal += itemPrice;
    totalDiscount += itemDiscount;

    orderItems.push({
      product: product._id,
      quantity: item.quantity,
      price: product.price,
      discount: product.discount || 0,
      total: itemPrice - itemDiscount,
    });
  }

  const tax = (subtotal - totalDiscount) * 0.1;
  let total = subtotal - totalDiscount + tax;

  // apply coupon
  let couponApplied = null;
  let couponDiscountAmount = 0;

  if (couponCode) {
    const coupon = await Coupon.findOne({
      code: couponCode,
      isActive: true,
    });

    if (coupon && new Date() < coupon.expiryDate) {
      if (coupon.discountType === "percentage") {
        couponDiscountAmount = (total * coupon.discountValue) / 100;
      } else {
        couponDiscountAmount = coupon.discountValue;
      }
      couponDiscountAmount = Math.min(couponDiscountAmount, total);
      couponApplied = coupon._id;
      total -= couponDiscountAmount;

      // Update coupon usage
      await Coupon.findByIdAndUpdate(couponApplied, {
        $inc: { usageCount: 1 },
      });
    }
  }

  // create order and save to database
  const order = await Order.create({
    user: userId,
    items: orderItems,
    shippingAddress,
    billingAddress: billingAddressSame
      ? shippingAddress
      : req.body.billingAddress,
    paymentMethod,
    subtotal,
    discount: totalDiscount + couponDiscountAmount,
    tax,
    total,
    coupon: couponApplied,
    status: "pending",
    paymentStatus: "pending",
  });

  // clear cart
  await Cart.findOneAndUpdate(
    { user: userId },
    {
      items: [],
      totalItems: 0,
      totalPrice: 0,
    }
  );

  // send confirmation email
  const user = await User.findById(userId);

  await sendEmail({
    email: user.email,
    subject: `Order Confirmation - ${order._id}`,
    message: `
      Your order has been created successfully!
      
      Order ID: ${order._id}
      Total: $${order.total}
      Status: Pending Payment
      
      Please proceed with payment to confirm your order.
    `,
  });

  // return order
  res.status(201).json({
    success: true,
    message: "Order created successfully. Proceed to payment.",
    data: {
      orderId: order._id,
      amount: order.total,
      paymentMethod: order.paymentMethod,
      items: order.items.length,
    },
  });
});

exports.getCheckoutPreview = catchAsync(async (req, res, next) => {
  const userId = req.user.id;

  console.log("Preview");

  const cart = await Cart.findOne({ user: userId }).populate("items.product");

  if (!cart || cart.items.length === 0) {
    return next(new AppError("Your cart is empty", 400));
  }

  // generate preview (temporary)
  let subtotal = 0;
  let totalDiscount = 0;
  const previewItems = [];

  for (let item of cart.items) {
    const product = item.product;
    const itemPrice = product.price * item.quantity;
    const itemDiscount = (itemPrice * (product.discount || 0)) / 100;

    subtotal += itemPrice;
    totalDiscount += itemDiscount;

    previewItems.push({
      productId: product._id,
      name: product.name,
      price: product.price,
      quantity: item.quantity,
      discount: product.discount,
      subtotal: itemPrice,
      discountAmount: itemDiscount,
    });
  }

  const tax = (subtotal - totalDiscount) * 0.1;
  const total = subtotal - totalDiscount + tax;

  // Return preview (NO database save)
  res.status(200).json({
    success: true,
    message: "Checkout preview",
    preview: {
      items: previewItems,
      itemCount: previewItems.length,
      subtotal: subtotal.toFixed(2),
      totalDiscount: totalDiscount.toFixed(2),
      tax: tax.toFixed(2),
      total: total.toFixed(2),
    },
  });
});

// applying coupon
exports.applyCoupon = catchAsync(async (req, res, next) => {
  const { couponCode } = req.body;
  const userId = req.user.id;

  console.log("Applying Coupon");

  const cart = await Cart.findOne({ user: userId });

  if (!cart || cart.items.length === 0) {
    return next(new AppError("Your cart is empty", 400));
  }

  // Validate coupon (don't save yet)
  const coupon = await Coupon.findOne({
    code: couponCode.toUpperCase(),
    isActive: true,
  });

  if (!coupon) {
    return next(new AppError("Invalid coupon code", 400));
  }

  if (new Date() > coupon.expiryDate) {
    return next(new AppError("Coupon has expired", 400));
  }

  // Calculate discount (temporary)
  let discountAmount = 0;

  if (coupon.discountType === "percentage") {
    discountAmount = (cart.totalPrice * coupon.discountValue) / 100;
  } else {
    discountAmount = coupon.discountValue;
  }

  const finalPrice = cart.totalPrice - discountAmount;

  // Return preview (NO database save)
  res.status(200).json({
    success: true,
    message: "Coupon applied",
    preview: {
      couponCode,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      originalPrice: cart.totalPrice,
      discountAmount: discountAmount.toFixed(2),
      finalPrice: finalPrice.toFixed(2),
    },
  });
});

// estimate shipping
exports.estimateShipping = catchAsync(async (req, res, next) => {
  const { shippingAddress, weight } = req.body;

  console.log("Estimating Shipping");

  if (!shippingAddress || !shippingAddress.country) {
    return next(new AppError("Country is required for shipping", 400));
  }

  // Temporary calculation based on country and weight
  let shippingCost = 0;

  if (shippingAddress.country === "UGANDA") {
    shippingCost = weight ? weight * 0.5 + 5 : 10;
  } else if (shippingAddress.country === "Canada") {
    shippingCost = weight ? weight * 0.7 + 8 : 15;
  } else {
    shippingCost = weight ? weight * 1 + 15 : 25;
  }

  // Return estimate (NO database save)
  res.status(200).json({
    success: true,
    message: "Shipping estimated",
    estimate: {
      country: shippingAddress.country,
      weight: weight || "Unknown",
      shippingCost: shippingCost.toFixed(2),
      estimatedDays: 5,
    },
  });
});
