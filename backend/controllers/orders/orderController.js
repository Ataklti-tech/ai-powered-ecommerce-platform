const Order = require("./../../models/orderModel");
const User = require("./../../models/userModel");
const Product = require("./../../models/productModel");
const catchAsync = require("./../../utils/constants/catchAsync");
const APIFeatures = require("./../../utils/constants/apifeatures");
const AppError = require("./../../utils/constants/appError");
const Cart = require("./../../models/cartModel");
const sendEmail = require("./../../services/email/emailService");
const Coupon = require("./../../models/couponModel");
const { trace } = require("../../routes/auth/userRoutes");
const { trackActivity } = require("../analytics/userActivityController");

// When user clicks "Place Order" button in checkout
// This function:
// - Get user's cart items
// - Validates product stock
// - Reduces product stock
// - Creates order with items and status "pending"
// - Clear's user's cart
// - Returns order details

exports.createOrder = catchAsync(async (req, res, next) => {
  const userId = req.user.id;
  const { shippingAddress, paymentMethod, couponCode } = req.body;

  // 1. Validate input
  if (!shippingAddress || !paymentMethod) {
    return next(
      new AppError("Shipping address and payment method are required", 400)
    );
  }

  // 2. Get user's cart with populated products
  const cart = await Cart.findOne({ user: userId }).populate("items.product");

  // Check if cart exists and has items
  if (!cart || cart.items.length === 0) {
    return next(new AppError("Your cart is empty", 400));
  }

  // 3. Validate stock availability for all items
  for (let item of cart.items) {
    const product = await Product.findById(item.product._id);
    if (!product) {
      return next(
        new AppError(`Product ${item.product.name} is no longer available`, 404)
      );
    }
    if (product.stock < item.quantity) {
      return next(
        new AppError(
          `Insufficient stock for ${product.name}. Available: ${product.stock}`,
          400
        )
      );
    }
  }

  // 4. Calculate order totals
  let subtotal = 0;
  let totalDiscount = 0;
  const orderItems = [];

  for (let item of cart.items) {
    const product = item.product;
    const itemPrice = product.price * item.quantity;
    const itemDiscount = (itemPrice * (product.discount || 0)) / 100;

    subtotal += itemPrice;
    totalDiscount += itemDiscount;

    // add to orderItems array
    orderItems.push({
      product: product._id,
      quantity: item.quantity,
      price: product.price,
      discount: product.discount || 0,
      total: itemPrice - itemDiscount,
    });
  }

  // calculate tax (10% of subtotal after discount)
  const taxableAmount = subtotal - totalDiscount;
  const tax = taxableAmount * 0.1;

  // Final total
  const total = taxableAmount + tax;

  // 5. apply coupon if provided
  let couponData = null;
  let couponDiscount = 0;
  if (couponCode) {
    // const Coupon = require("./../../models/couponModel");
    const coupon = await Coupon.findOne({
      code: couponCode.toUpperCase(),
      isActive: true,
    });

    if (coupon && new Date() < coupon.expiryDate) {
      if (coupon.discountType === "percentage") {
        couponDiscount = (total * coupon.discountValue) / 100;
      } else {
        couponDiscount = coupon.discountValue;
      }
      couponDiscount = Math.min(couponDiscount, total);
    }
  }

  const finalTotal = total - couponDiscount;

  // 6. Create the order
  const order = await Order.create({
    orderNumber: `ORD-${Date.now()}`,
    user: userId,
    items: orderItems,
    shippingAddress,
    payment: {
      method: paymentMethod,
      status: "completed",
    },
    subtotal,
    discount: {
      amount: totalDiscount + couponDiscount,
    },
    tax,
    totalAmount: finalTotal,

    paymentStatus: "completed",
  });

  // 7. Reduce product stock
  for (let item of cart.items) {
    await Product.findByIdAndUpdate(
      item.product._id,
      { $inc: { stock: -item.quantity } },
      { new: true }
    );
  }

  // 8. Clear user's cart
  await Cart.findOneAndUpdate(
    { user: userId },
    {
      items: [],
      totalItems: 0,
      totalPrice: 0,
    }
  );

  // 9. Send order confirmation email / development phase using mailtrap + nodemailer
  const emailMessage = `
    Your order has been placed successfully!
    Order ID: ${order.orderNumber}
    Total: $${finalTotal}
    Status: Pending Payment

    Please proceed with payment to confirm your order.
  `;

  await sendEmail({
    email: req.user.email,
    subject: "Order Confirmation - Pending Payment",
    message: emailMessage,
  });

  // Populate and return order
  await order.populate("items.product user");

  res.status(201).json({
    success: true,
    message: "Order created successfully. Proceed to payment.",
    data: order,
  });
});

// Getting all orders (user)
// exports.getAllOrders = catchAsync(async (req, res, next) => {
//   const usersOrders = await Order.find();
//   // I will need pagination here
//   res.status(200).json({
//     status: "success",
//     data: usersOrders,
//   });
// });

// get all orders (user's orders)
exports.getAllOrders = catchAsync(async (req, res, next) => {
  const userId = req.user.id;
  const page = req.query.page || 1;
  const limit = req.query.limit || 10;
  const skip = (page - 1) * limit;

  // Get orders for this user only
  const orders = await Order.find({ user: userId })
    .populate("items.product", "name price image")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  // Get total count for pagination
  const totalOrders = await Order.countDocuments({ user: userId });

  res.status(200).json({
    success: true,
    count: orders.length,
    totalOrders,
    pages: Math.ceil(totalOrders / limit),
    currentPage: page,
    data: orders,
  });
});

// 3. GET SINGLE ORDER BY ID

exports.getOrder = catchAsync(async (req, res, next) => {
  const { orderId } = req.params;

  const order = await Order.findById(orderId)
    .populate("items.product")
    .populate("user", "name email phone");

  if (!order) {
    return next(new AppError("Order not found", 404));
  }

  // Check if user is the order owner or admin
  if (
    req.user._id.toString() !== order.user._id.toString() &&
    req.user.role !== "admin"
  ) {
    return next(new AppError("You are not authorized to view this order", 403));
  }

  res.status(200).json({
    success: true,
    data: order,
  });
});

// 4. UPDATE ORDER STATUS (Admin Only)

exports.updateOrderStatus = catchAsync(async (req, res, next) => {
  const { orderId } = req.params;
  const { status } = req.body;

  const validStatuses = [
    "pending",
    "confirmed",
    "shipped",
    "delivered",
    "cancelled",
  ];

  if (!validStatuses.includes(status)) {
    return next(new AppError("Invalid order status", 400));
  }

  const order = await Order.findByIdAndUpdate(
    orderId,
    { status, updatedAt: new Date() },
    { new: true, runValidators: true }
  ).populate("user", "name email");

  if (!order) {
    return next(new AppError("Order not found", 404));
  }

  // Send status update email to customer
  const statusMessages = {
    confirmed: "Your order has been confirmed and is being prepared",
    shipped: "Your order has been shipped. Track it using the tracking number",
    delivered: "Your order has been delivered. Thank you for shopping with us!",
    cancelled: "Your order has been cancelled. Refund will be processed.",
  };

  if (statusMessages[status]) {
    await sendEmail({
      email: order.user.email,
      subject: `Order Status Update - ${status.toUpperCase()}`,
      message: statusMessages[status],
    });
  }

  res.status(200).json({
    success: true,
    message: `Order status updated to ${status}`,
    data: order,
  });
});

// 5. CANCEL ORDER
exports.cancelOrder = catchAsync(async (req, res, next) => {
  const { orderId } = req.params;
  const userId = req.user.id;

  const order = await Order.findById(orderId).populate("items.product");

  if (!order) {
    return next(new AppError("Order not found", 404));
  }

  // Check if user owns this order
  if (order.user.toString() !== userId && req.user.role !== "admin") {
    return next(
      new AppError("You are not authorized to cancel this order", 403)
    );
  }

  // Can't cancel if already shipped or delivered
  if (order.status === "shipped" || order.status === "delivered") {
    return next(
      new AppError(`Cannot cancel order with status: ${order.status}`, 400)
    );
  }

  // Restore product stock
  for (let item of order.items) {
    await Product.findByIdAndUpdate(
      item.product._id,
      { $inc: { stock: item.quantity } },
      { new: true }
    );
  }

  // Update order status
  order.status = "cancelled";
  order.paymentStatus = "refunded";
  await order.save();

  // Send cancellation email
  await sendEmail({
    email: req.user.email,
    subject: "Order Cancelled",
    message: `Your order ${orderId} has been cancelled. Your payment will be refunded within 5-7 business days.`,
  });

  res.status(200).json({
    success: true,
    message: "Order cancelled successfully. Refund initiated.",
    data: order,
  });
});

// 6. UPDATE PAYMENT STATUS

exports.updatePaymentStatus = catchAsync(async (req, res, next) => {
  const { orderId } = req.params;
  const { paymentStatus, transactionId } = req.body;

  const order = await Order.findById(orderId);

  if (!order) {
    return next(new AppError("Order not found", 404));
  }

  // Only allow certain transitions
  if (!["paid", "failed", "pending"].includes(paymentStatus)) {
    return next(new AppError("Invalid payment status", 400));
  }

  order.paymentStatus = paymentStatus;
  order.transactionId = transactionId;

  // If payment is successful, confirm order
  if (paymentStatus === "paid") {
    order.status = "confirmed";

    await sendEmail({
      email: order.user.email,
      subject: "Payment Successful - Order Confirmed",
      message: `Hello ${order.user.name}, 
      Your payment was successful

      Order Number: ${order.orderNumber}
      Amount Paid: ${order.totalAmount}

      Order is being prepared for shipping
      `,
    });

    // track purchase for each item
    for (const item of order.items) {
      await trackActivity(order.user, item.product._id, "purchase");
    }
  }

  await order.save();

  res.status(200).json({
    success: true,
    message: "Payment status updated",
    data: order,
  });
});

// 7. GET ORDER TRACKING

exports.getOrderTracking = catchAsync(async (req, res, next) => {
  const { orderId } = req.params;
  const userId = req.user.id;

  const order = await Order.findById(orderId);

  if (!order) {
    return next(new AppError("Order not found", 404));
  }

  if (order.user.toString() !== userId && req.user.role !== "admin") {
    return next(
      new AppError("You are not authorized to track this order", 403)
    );
  }

  // Calculate estimated delivery
  const statusSteps = [
    {
      status: "pending",
      message: "Order Pending Payment",
      date: order.createdAt,
    },
    {
      status: "confirmed",
      message: "Order Confirmed",
      date: order.confirmedAt,
    },
    { status: "shipped", message: "Order Shipped", date: order.shippedAt },
    {
      status: "delivered",
      message: "Order Delivered",
      date: order.deliveredAt,
    },
  ];

  res.status(200).json({
    success: true,
    data: {
      orderId: order._id,
      currentStatus: order.status,
      trackingNumber: order.trackingNumber,
      estimatedDelivery: new Date(
        order.shippedAt
          ? order.shippedAt.getTime() + 7 * 24 * 60 * 60 * 1000
          : null
      ),
      statusTimeline: statusSteps,
      items: order.items,
    },
  });
});

// GET ALL ORDERS (Admin Dashboard)

exports.getAllOrdersAdmin = catchAsync(async (req, res, next) => {
  const page = req.query.page || 1;
  const limit = req.query.limit || 20;
  const skip = (page - 1) * limit;
  const status = req.query.status;

  // Build filter
  let filter = {};
  if (status) {
    filter.status = status;
  }

  const orders = await Order.find(filter)
    .populate("user", "name email phone")
    .populate("items.product", "name price")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  const totalOrders = await Order.countDocuments(filter);

  res.status(200).json({
    success: true,
    count: orders.length,
    totalOrders,
    data: orders,
  });
});

// ORDER STATISTICS (Admin)

exports.getOrderStatistics = catchAsync(async (req, res, next) => {
  const totalOrders = await Order.countDocuments();
  const pendingOrders = await Order.countDocuments({ status: "pending" });
  const shippedOrders = await Order.countDocuments({ status: "shipped" });
  const deliveredOrders = await Order.countDocuments({ status: "delivered" });
  const cancelledOrders = await Order.countDocuments({ status: "cancelled" });

  // Calculate total revenue
  const revenueData = await Order.aggregate([
    { $match: { paymentStatus: "paid" } },
    { $group: { _id: null, totalRevenue: { $sum: "$totalAmount" } } },
  ]);

  const totalRevenue = revenueData[0]?.totalRevenue || 0;

  res.status(200).json({
    success: true,
    data: {
      totalOrders,
      pendingOrders,
      shippedOrders,
      deliveredOrders,
      cancelledOrders,
      totalRevenue,
    },
  });
});

exports.generateInvoice = catchAsync(async (req, res, next) => {
  const { orderId } = req.params;
  const userId = req.user.id;

  const order = await Order.findById(orderId)
    .populate("items.product")
    .populate("user");

  if (!order) {
    return next(new AppError("Order not found", 404));
  }

  if (order.user._id.toString() !== userId && req.user.role !== "admin") {
    return next(
      new AppError("You are not authorized to generate this invoice", 403)
    );
  }

  // PDF generation logic would go here
  // Using libraries like pdfkit or puppeteer

  res.status(200).json({
    success: true,
    message: "Invoice generated successfully",
    data: {
      orderId: order._id,
      invoiceUrl: `/invoices/${orderId}.pdf`,
    },
  });
});
