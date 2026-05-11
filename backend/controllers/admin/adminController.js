const mongoose = require('mongoose');
const User = require('../../models/userModel');
const Product = require('../../models/productModel');
const Order = require('../../models/orderModel');
const Category = require('../../models/categoryModel');
const UserActivity = require('../../models/userActivityModel');
const catchAsync = require('../../utils/constants/catchAsync');
const AppError = require('../../utils/constants/appError');

// ═══════════════════════════════════════════════════
//  DASHBOARD OVERVIEW
// ═══════════════════════════════════════════════════

exports.getDashboardStats = catchAsync(async (req, res) => {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

  // Run all counts in parallel
  const [
    totalUsers,
    newUsersThisMonth,
    totalProducts,
    activeProducts,
    totalOrders,
    ordersThisMonth,
    pendingOrders,
    revenueData,
    revenueLastMonth,
    lowStockProducts,
    recentOrders,
    topProducts,
    ordersByStatus,
    dailyRevenue,
  ] = await Promise.all([
    // Users
    User.countDocuments(),
    User.countDocuments({ createdAt: { $gte: startOfMonth } }),

    // Products
    Product.countDocuments(),
    Product.countDocuments({ status: 'active' }),

    // Orders
    Order.countDocuments(),
    Order.countDocuments({ createdAt: { $gte: startOfMonth } }),
    Order.countDocuments({ status: 'pending' }),

    // Revenue this month
    Order.aggregate([
      {
        $match: {
          'payment.status': 'completed',
          createdAt: { $gte: startOfMonth },
        },
      },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } },
    ]),

    // Revenue last month
    Order.aggregate([
      {
        $match: {
          'payment.status': 'completed',
          createdAt: { $gte: startOfLastMonth, $lte: endOfLastMonth },
        },
      },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } },
    ]),

    // Low stock (under 10 units)
    Product.countDocuments({ stock: { $lt: 10, $gt: 0 } }),

    // Recent 10 orders
    Order.find()
      .populate('user', 'firstName lastName email')
      .sort({ createdAt: -1 })
      .limit(10)
      .lean(),

    // Top 5 selling products this month
    Order.aggregate([
      { $match: { createdAt: { $gte: startOfMonth } } },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.product',
          totalSold: { $sum: '$items.quantity' },
          revenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } },
        },
      },
      { $sort: { totalSold: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: 'products',
          localField: '_id',
          foreignField: '_id',
          as: 'product',
        },
      },
      { $unwind: '$product' },
      {
        $project: {
          'product.name': 1,
          'product.price': 1,
          'product.images': 1,
          totalSold: 1,
          revenue: 1,
        },
      },
    ]),

    // Orders grouped by status
    Order.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),

    // Daily revenue last 30 days
    Order.aggregate([
      {
        $match: {
          'payment.status': 'completed',
          createdAt: { $gte: new Date(now - 30 * 24 * 60 * 60 * 1000) },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
          },
          revenue: { $sum: '$totalAmount' },
          orders: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]),
  ]);

  const thisMonthRevenue = revenueData[0]?.total || 0;
  const lastMonthRevenue = revenueLastMonth[0]?.total || 0;
  const revenueGrowth =
    lastMonthRevenue === 0
      ? 100
      : (
          ((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) *
          100
        ).toFixed(1);

  // Total all-time revenue
  const totalRevenueData = await Order.aggregate([
    { $match: { 'payment.status': 'completed' } },
    { $group: { _id: null, total: { $sum: '$totalAmount' } } },
  ]);

  res.status(200).json({
    status: 'success',
    data: {
      overview: {
        totalUsers,
        newUsersThisMonth,
        totalProducts,
        activeProducts,
        totalOrders,
        ordersThisMonth,
        pendingOrders,
        lowStockProducts,
        totalRevenue: totalRevenueData[0]?.total || 0,
        revenueThisMonth: thisMonthRevenue,
        revenueLastMonth: lastMonthRevenue,
        revenueGrowthPercent: Number(revenueGrowth),
      },
      recentOrders,
      topProducts,
      ordersByStatus: ordersByStatus.reduce((acc, s) => {
        acc[s._id] = s.count;
        return acc;
      }, {}),
      dailyRevenue,
    },
  });
});

// ═══════════════════════════════════════════════════
//  REVENUE ANALYTICS
// ═══════════════════════════════════════════════════

exports.getRevenueAnalytics = catchAsync(async (req, res) => {
  const { period = 'monthly', year = new Date().getFullYear() } = req.query;

  let groupFormat;
  if (period === 'daily') groupFormat = '%Y-%m-%d';
  else if (period === 'weekly') groupFormat = '%Y-%U';
  else groupFormat = '%Y-%m';

  const startDate = new Date(`${year}-01-01`);
  const endDate = new Date(`${Number(year) + 1}-01-01`);

  const revenue = await Order.aggregate([
    {
      $match: {
        'payment.status': 'completed',
        createdAt: { $gte: startDate, $lt: endDate },
      },
    },
    {
      $group: {
        _id: { $dateToString: { format: groupFormat, date: '$createdAt' } },
        revenue: { $sum: '$totalAmount' },
        orders: { $sum: 1 },
        avgOrderValue: { $avg: '$totalAmount' },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  // Revenue by category this year
  const revenueByCategory = await Order.aggregate([
    {
      $match: {
        'payment.status': 'completed',
        createdAt: { $gte: startDate, $lt: endDate },
      },
    },
    { $unwind: '$items' },
    {
      $lookup: {
        from: 'products',
        localField: 'items.product',
        foreignField: '_id',
        as: 'product',
      },
    },
    { $unwind: '$product' },
    {
      $lookup: {
        from: 'categories',
        localField: 'product.category',
        foreignField: '_id',
        as: 'category',
      },
    },
    { $unwind: { path: '$category', preserveNullAndEmptyArrays: true } },
    {
      $group: {
        _id: '$category.name',
        revenue: {
          $sum: { $multiply: ['$items.price', '$items.quantity'] },
        },
        itemsSold: { $sum: '$items.quantity' },
      },
    },
    { $sort: { revenue: -1 } },
  ]);

  res.status(200).json({
    status: 'success',
    data: { period, year, revenue, revenueByCategory },
  });
});

// ═══════════════════════════════════════════════════
//  USER MANAGEMENT
// ═══════════════════════════════════════════════════

exports.getAllUsers = catchAsync(async (req, res) => {
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 20;
  const skip = (page - 1) * limit;
  const { search, role, sortBy = 'createdAt', order = 'desc' } = req.query;

  const filter = {};
  if (role) filter.role = role;
  if (search) {
    filter.$or = [
      { firstName: { $regex: search, $options: 'i' } },
      { lastName: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
    ];
  }

  const sortOrder = order === 'asc' ? 1 : -1;

  const [users, total] = await Promise.all([
    User.find(filter)
      .select('-password -passwordResetToken -passwordResetExpires')
      .sort({ [sortBy]: sortOrder })
      .skip(skip)
      .limit(limit)
      .lean(),
    User.countDocuments(filter),
  ]);

  // Attach order count per user
  const userIds = users.map((u) => u._id);
  const orderCounts = await Order.aggregate([
    { $match: { user: { $in: userIds } } },
    {
      $group: {
        _id: '$user',
        count: { $sum: 1 },
        spent: { $sum: '$totalAmount' },
      },
    },
  ]);
  const orderMap = orderCounts.reduce((acc, o) => {
    acc[o._id.toString()] = { orders: o.count, totalSpent: o.spent };
    return acc;
  }, {});

  const enriched = users.map((u) => ({
    ...u,
    ...(orderMap[u._id.toString()] || { orders: 0, totalSpent: 0 }),
  }));

  res.status(200).json({
    status: 'success',
    results: users.length,
    total,
    pages: Math.ceil(total / limit),
    currentPage: page,
    data: enriched,
  });
});

exports.getUserDetail = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.params.id)
    .select('-password -passwordResetToken -passwordResetExpires')
    .lean();

  if (!user) return next(new AppError('User not found', 404));

  const [orders, activities] = await Promise.all([
    Order.find({ user: req.params.id })
      .select('orderNumber status totalAmount createdAt payment.status')
      .sort({ createdAt: -1 })
      .limit(10)
      .lean(),
    UserActivity.find({ user: req.params.id })
      .populate('product', 'name price')
      .sort({ timestamp: -1 })
      .limit(20)
      .lean(),
  ]);

  res.status(200).json({
    status: 'success',
    data: { user, orders, activities },
  });
});

exports.updateUserRole = catchAsync(async (req, res, next) => {
  const { role } = req.body;
  if (!['user', 'admin'].includes(role)) {
    return next(new AppError('Invalid role. Must be "user" or "admin"', 400));
  }

  const user = await User.findByIdAndUpdate(
    req.params.id,
    { role },
    { new: true, runValidators: true }
  ).select('-password');

  if (!user) return next(new AppError('User not found', 404));

  res.status(200).json({ status: 'success', data: user });
});

exports.deactivateUser = catchAsync(async (req, res, next) => {
  const user = await User.findByIdAndUpdate(
    req.params.id,
    { active: false },
    { new: true }
  ).select('-password');

  if (!user) return next(new AppError('User not found', 404));

  res
    .status(200)
    .json({ status: 'success', message: 'User deactivated', data: user });
});

exports.activateUser = catchAsync(async (req, res, next) => {
  // bypass the pre-find active filter by using findOneAndUpdate directly
  const user = await User.findOneAndUpdate(
    { _id: req.params.id },
    { active: true },
    { new: true }
  ).select('-password');

  if (!user) return next(new AppError('User not found', 404));

  res
    .status(200)
    .json({ status: 'success', message: 'User activated', data: user });
});

// ═══════════════════════════════════════════════════
//  PRODUCT MANAGEMENT (with S3 upload)
// ═══════════════════════════════════════════════════

exports.adminCreateProduct = catchAsync(async (req, res, next) => {
  const {
    name,
    description,
    price,
    discount,
    stock,
    category,
    status,
    isFeatured,
    isNewArrival,
    isBestseller,
    isOnSale,
    specifications,
    variants,
    images, // populated by processProductImages middleware from S3
  } = req.body;

  if (!name || !price || !stock || !category) {
    return next(
      new AppError('name, price, stock, and category are required', 400)
    );
  }

  const product = await Product.create({
    name,
    description,
    price: Number(price),
    discount: Number(discount) || 0,
    stock: Number(stock),
    category,
    status: status || 'active',
    isFeatured: isFeatured === 'true' || isFeatured === true,
    isNewArrival: isNewArrival === 'true' || isNewArrival === true,
    isBestseller: isBestseller === 'true' || isBestseller === true,
    isOnSale: isOnSale === 'true' || isOnSale === true,
    images: images || [],
    specifications: specifications ? JSON.parse(specifications) : [],
    variants: variants ? JSON.parse(variants) : [],
  });

  res.status(201).json({ status: 'success', data: product });
});

exports.adminUpdateProduct = catchAsync(async (req, res, next) => {
  const updates = { ...req.body };

  // Parse JSON strings sent as form-data fields
  if (typeof updates.specifications === 'string') {
    updates.specifications = JSON.parse(updates.specifications);
  }
  if (typeof updates.variants === 'string') {
    updates.variants = JSON.parse(updates.variants);
  }
  if (updates.price) updates.price = Number(updates.price);
  if (updates.stock) updates.stock = Number(updates.stock);
  if (updates.discount) updates.discount = Number(updates.discount);

  // Merge kept existing images (sent as JSON strings) with newly uploaded ones
  const hasKeepImages = 'keepImages' in req.body;
  const hasNewImages = Array.isArray(req.body.images) && req.body.images.length > 0;
  if (hasKeepImages || hasNewImages) {
    const keepRaw = hasKeepImages
      ? (Array.isArray(req.body.keepImages) ? req.body.keepImages : [req.body.keepImages])
      : [];
    const keptImages = keepRaw.map((k) => {
      try { return JSON.parse(k); } catch { return { url: k, alt: 'Product image', isPrimary: false }; }
    });
    updates.images = [...keptImages, ...(req.body.images || [])];
  }

  const product = await Product.findByIdAndUpdate(req.params.id, updates, {
    new: true,
    runValidators: true,
  });

  if (!product) return next(new AppError('Product not found', 404));

  res.status(200).json({ status: 'success', data: product });
});

exports.adminDeleteProduct = catchAsync(async (req, res, next) => {
  const product = await Product.findByIdAndDelete(req.params.id);
  if (!product) return next(new AppError('Product not found', 404));
  res.status(204).json({ status: 'success', data: null });
});

exports.getLowStockProducts = catchAsync(async (req, res) => {
  const threshold = Number(req.query.threshold) || 10;
  const products = await Product.find({ stock: { $lte: threshold } })
    .select('name stock price category status images')
    .populate('category', 'name')
    .sort({ stock: 1 })
    .lean();

  res.status(200).json({
    status: 'success',
    count: products.length,
    data: products,
  });
});

exports.getProductStats = catchAsync(async (req, res) => {
  const [
    totalProducts,
    activeProducts,
    outOfStock,
    lowStock,
    categoryBreakdown,
    topRated,
  ] = await Promise.all([
    Product.countDocuments(),
    Product.countDocuments({ status: 'active' }),
    Product.countDocuments({ stock: 0 }),
    Product.countDocuments({ stock: { $gt: 0, $lte: 10 } }),
    Product.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } },
      {
        $lookup: {
          from: 'categories',
          localField: '_id',
          foreignField: '_id',
          as: 'category',
        },
      },
      { $unwind: { path: '$category', preserveNullAndEmptyArrays: true } },
      { $project: { name: '$category.name', count: 1 } },
      { $sort: { count: -1 } },
    ]),
    Product.find()
      .select('name rating price stock images')
      .sort({ 'rating.average': -1 })
      .limit(5)
      .lean(),
  ]);

  res.status(200).json({
    status: 'success',
    data: {
      totalProducts,
      activeProducts,
      outOfStock,
      lowStock,
      categoryBreakdown,
      topRated,
    },
  });
});

// ═══════════════════════════════════════════════════
//  ORDER MANAGEMENT
// ═══════════════════════════════════════════════════

exports.getAllOrdersAdmin = catchAsync(async (req, res) => {
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 20;
  const skip = (page - 1) * limit;
  const { status, paymentStatus, search, startDate, endDate } = req.query;

  const filter = {};
  if (status) filter.status = status;
  if (paymentStatus) filter['payment.status'] = paymentStatus;
  if (startDate || endDate) {
    filter.createdAt = {};
    if (startDate) filter.createdAt.$gte = new Date(startDate);
    if (endDate) filter.createdAt.$lte = new Date(endDate);
  }

  const [orders, total] = await Promise.all([
    Order.find(filter)
      .populate('user', 'firstName lastName email phone')
      .populate('items.product', 'name price images')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Order.countDocuments(filter),
  ]);

  res.status(200).json({
    status: 'success',
    results: orders.length,
    total,
    pages: Math.ceil(total / limit),
    currentPage: page,
    data: orders,
  });
});

exports.adminUpdateOrderStatus = catchAsync(async (req, res, next) => {
  const { status, note } = req.body;
  const validStatuses = [
    'pending',
    'confirmed',
    'processing',
    'shipping',
    'delivered',
    'cancelled',
    'returned',
  ];

  if (!validStatuses.includes(status)) {
    return next(
      new AppError(
        `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
        400
      )
    );
  }

  const order = await Order.findById(req.params.id).populate(
    'user',
    'email firstName'
  );
  if (!order) return next(new AppError('Order not found', 404));

  order.status = status;
  order.statusHistory.push({ status, note: note || '', timestamp: new Date() });
  await order.save();

  res.status(200).json({ status: 'success', data: order });
});

// ═══════════════════════════════════════════════════
//  USER ACTIVITY MONITORING
// ═══════════════════════════════════════════════════

exports.getAllActivities = catchAsync(async (req, res) => {
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 50;
  const skip = (page - 1) * limit;
  const { activityType, userId, startDate, endDate } = req.query;

  const filter = {};
  if (activityType) filter.activityType = activityType;
  if (userId) filter.user = new mongoose.Types.ObjectId(userId);
  if (startDate || endDate) {
    filter.timestamp = {};
    if (startDate) filter.timestamp.$gte = new Date(startDate);
    if (endDate) filter.timestamp.$lte = new Date(endDate);
  }

  const [activities, total] = await Promise.all([
    UserActivity.find(filter)
      .populate('user', 'firstName lastName email')
      .populate('product', 'name price')
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    UserActivity.countDocuments(filter),
  ]);

  res.status(200).json({
    status: 'success',
    results: activities.length,
    total,
    pages: Math.ceil(total / limit),
    currentPage: page,
    data: activities,
  });
});

exports.getActivitySummary = catchAsync(async (req, res) => {
  const days = Number(req.query.days) || 7;
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const [byType, dailyActivity, mostActiveUsers, mostViewedProducts] =
    await Promise.all([
      // Activity breakdown by type
      UserActivity.aggregate([
        { $match: { timestamp: { $gte: since } } },
        { $group: { _id: '$activityType', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),

      // Activity per day
      UserActivity.aggregate([
        { $match: { timestamp: { $gte: since } } },
        {
          $group: {
            _id: {
              $dateToString: { format: '%Y-%m-%d', date: '$timestamp' },
            },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),

      // Top 10 most active users
      UserActivity.aggregate([
        { $match: { timestamp: { $gte: since } } },
        { $group: { _id: '$user', actions: { $sum: 1 } } },
        { $sort: { actions: -1 } },
        { $limit: 10 },
        {
          $lookup: {
            from: 'users',
            localField: '_id',
            foreignField: '_id',
            as: 'user',
          },
        },
        { $unwind: '$user' },
        {
          $project: {
            'user.firstName': 1,
            'user.lastName': 1,
            'user.email': 1,
            actions: 1,
          },
        },
      ]),

      // Top 10 most viewed products
      UserActivity.aggregate([
        {
          $match: {
            activityType: { $in: ['view', 'click'] },
            timestamp: { $gte: since },
          },
        },
        { $group: { _id: '$product', views: { $sum: 1 } } },
        { $sort: { views: -1 } },
        { $limit: 10 },
        {
          $lookup: {
            from: 'products',
            localField: '_id',
            foreignField: '_id',
            as: 'product',
          },
        },
        { $unwind: '$product' },
        {
          $project: {
            'product.name': 1,
            'product.price': 1,
            'product.images': 1,
            views: 1,
          },
        },
      ]),
    ]);

  res.status(200).json({
    status: 'success',
    data: {
      period: `Last ${days} days`,
      byType,
      dailyActivity,
      mostActiveUsers,
      mostViewedProducts,
    },
  });
});

// ═══════════════════════════════════════════════════
//  CATEGORY MANAGEMENT (with S3 image)
// ═══════════════════════════════════════════════════

exports.adminCreateCategory = catchAsync(async (req, res, next) => {
  const Category = require('../../models/categoryModel');
  const { name, description, isActive, displayOrder, image } = req.body;

  if (!name) return next(new AppError('Category name is required', 400));

  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

  const category = await Category.create({
    name,
    slug,
    description,
    isActive: isActive !== undefined ? isActive : true,
    displayOrder: Number(displayOrder) || 0,
    image: image || '',
  });

  res.status(201).json({ status: 'success', data: category });
});

exports.adminUpdateCategory = catchAsync(async (req, res, next) => {
  const Category = require('../../models/categoryModel');
  const updates = { ...req.body };

  if (updates.name) {
    updates.slug = updates.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  }

  const category = await Category.findByIdAndUpdate(req.params.id, updates, {
    new: true,
    runValidators: true,
  });

  if (!category) return next(new AppError('Category not found', 404));
  res.status(200).json({ status: 'success', data: category });
});
