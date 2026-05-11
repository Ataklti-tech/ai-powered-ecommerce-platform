const axios = require('axios');
const catchAsync = require('../../utils/constants/catchAsync');
const AppError = require('../../utils/constants/appError');
const Product = require('../../models/productModel');
const Order = require('../../models/orderModel');
const Review = require('../../models/reviewModel');
const Wishlist = require('../../models/wishListModel');
const UserActivity = require('../../models/userActivityModel');

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';
const AI_SERVICE_API_KEY = process.env.AI_SERVICE_API_KEY || '';

const aiHeaders = () => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${AI_SERVICE_API_KEY}`,
});

// ─── Helpers ─────────────────────────────────────────────────────────────────

const getUserBehaviorData = async (userId) => {
  try {
    const [orders, wishlist, recentActivity] = await Promise.all([
      Order.find({ user: userId })
        .populate('items.product', 'name category price')
        .limit(20)
        .sort({ createdAt: -1 }),
      Wishlist.findOne({ user: userId }).populate(
        'items.product',
        'name category price'
      ),
      UserActivity.find({ user: userId })
        .populate('product', 'name category')
        .limit(50)
        .sort({ createdAt: -1 }),
    ]);

    return {
      purchaseHistory: orders
        .flatMap((o) =>
          o.items.map((item) => ({
            productId: item.product?._id,
            category: item.product?.category,
            price: item.price,
          }))
        )
        .filter((i) => i.productId),

      wishlistItems:
        wishlist?.items.map((item) => ({
          productId: item.product?._id,
          category: item.product?.category,
        })) || [],

      // Fixed: was filtering by a.action — field is a.activityType
      recentlyViewed: recentActivity
        .filter((a) => a.activityType === 'view')
        .map((a) => ({
          productId: a.product?._id,
          category: a.product?.category,
        })),
    };
  } catch (err) {
    console.error('getUserBehaviorData error:', err.message);
    return { purchaseHistory: [], wishlistItems: [], recentlyViewed: [] };
  }
};

const fetchAndSortProducts = async (ids) => {
  if (!ids || ids.length === 0) return [];
  const products = await Product.find({ _id: { $in: ids }, status: 'active' });
  return ids
    .map((id) => products.find((p) => p._id.toString() === id.toString()))
    .filter(Boolean);
};

// ─── GET /api/v1/ai/for-you  (protected) ────────────────────────────────────
// Smart endpoint: "Trending For You" (new user) or "Recommended For You" (returning)
exports.getForYouRecommendations = catchAsync(async (req, res) => {
  const userId = req.user.id;
  const limit = parseInt(req.query.limit) || 10;

  // Determine if the user has meaningful history
  const [orderCount, reviewCount] = await Promise.all([
    Order.countDocuments({
      user: userId,
      status: { $in: ['confirmed', 'processing', 'shipped', 'delivered'] },
    }),
    Review.countDocuments({ user: userId }),
  ]);

  const isReturningUser = orderCount > 0 || reviewCount > 0;

  if (!isReturningUser) {
    // ── New / cold-start user → Trending For You ─────────────────────────────
    try {
      const response = await axios.get(
        `${AI_SERVICE_URL}/api/homepage?limit=${limit}`,
        { headers: aiHeaders(), timeout: 8000 }
      );
      const products = await fetchAndSortProducts(response.data.recommendations);
      return res.status(200).json({
        success: true,
        data: {
          type: 'trending_for_you',
          label: 'Trending For You',
          recommendations: products,
          count: products.length,
        },
      });
    } catch {
      const products = await Product.getTrending(limit);
      return res.status(200).json({
        success: true,
        data: {
          type: 'trending_for_you',
          label: 'Trending For You',
          recommendations: products,
          count: products.length,
        },
      });
    }
  }

  // ── Returning user → Recommended For You ────────────────────────────────────
  const userBehavior = await getUserBehaviorData(userId);

  try {
    const response = await axios.post(
      `${AI_SERVICE_URL}/api/recommendations`,
      { userId, requestType: 'personalized', limit, context: { userBehavior } },
      { headers: aiHeaders(), timeout: 10000 }
    );

    const products = await fetchAndSortProducts(response.data.recommendations);
    return res.status(200).json({
      success: true,
      data: {
        type: 'recommended_for_you',
        label: 'Recommended For You',
        recommendations: products,
        count: products.length,
        profile: { orderCount, reviewCount },
      },
    });
  } catch (err) {
    console.error('AI service error (for-you fallback):', err.message);
    const products = await Product.getTrending(limit);
    return res.status(200).json({
      success: true,
      data: {
        type: 'trending_for_you',
        label: 'Trending For You',
        recommendations: products,
        count: products.length,
      },
    });
  }
});

// ─── GET /api/v1/ai/homepage  (public) ──────────────────────────────────────
exports.getHomepageRecommendations = catchAsync(async (req, res) => {
  const limit = parseInt(req.query.limit) || 10;

  try {
    const response = await axios.get(
      `${AI_SERVICE_URL}/api/homepage?limit=${limit}`,
      { headers: aiHeaders(), timeout: 8000 }
    );

    const products = await fetchAndSortProducts(response.data.recommendations);
    return res.status(200).json({
      success: true,
      data: {
        type: 'ai_homepage',
        recommendations: products,
        count: products.length,
      },
    });
  } catch {
    const [featured, trending, newArrivals] = await Promise.all([
      Product.getFeatured(5),
      Product.getTrending(5),
      Product.getNewArrivals(5),
    ]);

    const seen = new Set();
    const combined = [...featured, ...trending, ...newArrivals]
      .filter((p) => {
        if (seen.has(p._id.toString())) return false;
        seen.add(p._id.toString());
        return true;
      })
      .slice(0, limit);

    return res.status(200).json({
      success: true,
      data: {
        type: 'homepage_fallback',
        recommendations: combined,
        count: combined.length,
      },
    });
  }
});

// ─── GET /api/v1/ai/recommendations  (protected, personalized) ──────────────
exports.getRecommendations = catchAsync(async (req, res) => {
  const userId = req.user?.id;
  const limit = parseInt(req.query.limit) || 10;

  const payload = {
    userId,
    requestType: 'personalized',
    limit,
    context: userId ? { userBehavior: await getUserBehaviorData(userId) } : {},
  };

  try {
    const response = await axios.post(
      `${AI_SERVICE_URL}/api/recommendations`,
      payload,
      { headers: aiHeaders(), timeout: 10000 }
    );

    const products = await fetchAndSortProducts(response.data.recommendations);
    return res.status(200).json({
      success: true,
      data: {
        type: response.data.type || 'personalized',
        recommendations: products,
        count: products.length,
      },
    });
  } catch {
    const products = await Product.getTrending(limit);
    return res.status(200).json({
      success: true,
      data: {
        type: 'trending_fallback',
        recommendations: products,
        count: products.length,
      },
    });
  }
});

// ─── GET /api/v1/ai/similar/:productId  (public) ────────────────────────────
exports.getSimilarProducts = catchAsync(async (req, res, next) => {
  const { productId } = req.params;
  const limit = parseInt(req.query.limit) || 5;

  const product = await Product.findById(productId);
  if (!product) return next(new AppError('Product not found', 404));

  try {
    const response = await axios.post(
      `${AI_SERVICE_URL}/api/similar`,
      { productId, category: product.category, limit },
      { headers: aiHeaders(), timeout: 8000 }
    );

    const products = await Product.find({
      _id: { $in: response.data.similarProducts },
      status: 'active',
      _id: { $ne: productId },
    });
    return res.status(200).json({ success: true, data: products });
  } catch {
    const related = await Product.getRelatedProducts(productId, limit);
    return res.status(200).json({ success: true, data: related });
  }
});

// ─── GET /api/v1/ai/bought-together/:productId  (public) ────────────────────
exports.getBoughtTogether = catchAsync(async (req, res) => {
  const { productId } = req.params;

  try {
    const response = await axios.post(
      `${AI_SERVICE_URL}/api/bought-together`,
      { productId, limit: 4 },
      { headers: aiHeaders(), timeout: 8000 }
    );

    const products = await Product.find({
      _id: { $in: response.data.recommendations },
      status: 'active',
    });
    return res.status(200).json({ success: true, data: products });
  } catch {
    return res.status(200).json({ success: true, data: [] });
  }
});

// ─── POST /api/v1/ai/track  (protected) ─────────────────────────────────────
exports.trackEvent = catchAsync(async (req, res) => {
  const { eventType, productId, metadata } = req.body;
  const userId = req.user?.id;

  try {
    await axios.post(
      `${AI_SERVICE_URL}/api/track`,
      { userId, eventType, productId, metadata, timestamp: new Date().toISOString() },
      { headers: aiHeaders(), timeout: 5000 }
    );
  } catch {
    // Tracking failures must never surface to the user
  }

  return res.status(200).json({ success: true });
});

// ─── GET /api/v1/ai/my-recommendations  (protected) ─────────────────────────
// Builds a full user profile from orders + activities + wishlist,
// calls FastAPI with weighted category preferences, returns product names.
exports.getMyRecommendations = catchAsync(async (req, res) => {
  const userId = req.user.id;
  const limit  = Math.min(parseInt(req.query.limit) || 12, 30);

  // 1. Fetch all activity sources in parallel
  const [orders, wishlist, activities] = await Promise.all([
    Order.find({ user: userId })
      .populate('items.product', 'name category price images')
      .sort({ createdAt: -1 })
      .limit(30),

    Wishlist.findOne({ user: userId })
      .populate('items.product', 'name category price'),

    UserActivity.find({ user: userId })
      .populate('product', 'name category')
      .sort({ createdAt: -1 })
      .limit(150),
  ]);

  // 2. Build weighted behavior profile
  const purchaseHistory = orders
    .flatMap((o) =>
      o.items.map((item) => ({
        productId: item.product?._id?.toString(),
        category:  item.product?.category?.toString(),
        price:     item.price,
      }))
    )
    .filter((i) => i.productId);

  const wishlistItems = (wishlist?.items || [])
    .map((item) => ({
      productId: item.product?._id?.toString(),
      category:  item.product?.category?.toString(),
    }))
    .filter((i) => i.productId);

  // Views + clicks + cart adds + wishlist_add from activity log
  const recentlyViewed = activities
    .filter((a) => ['view', 'click', 'add_to_cart', 'wishlist_add'].includes(a.activityType))
    .map((a) => ({
      productId: a.product?._id?.toString(),
      category:  a.product?.category?.toString(),
    }))
    .filter((i) => i.productId);

  const isNewUser =
    purchaseHistory.length === 0 &&
    wishlistItems.length === 0 &&
    recentlyViewed.length === 0;

  // 3. Build category preference summary for the response
  const catWeightMap = {};
  purchaseHistory.forEach((i) => { if (i.category) catWeightMap[i.category] = (catWeightMap[i.category] || 0) + 3; });
  wishlistItems.forEach((i)   => { if (i.category) catWeightMap[i.category] = (catWeightMap[i.category] || 0) + 2; });
  recentlyViewed.forEach((i)  => { if (i.category) catWeightMap[i.category] = (catWeightMap[i.category] || 0) + 1; });

  // 4. Call FastAPI with the full behavior context
  let productIds = [];
  let recType    = 'trending_fallback';
  let catWeightsFromAI = {};

  try {
    const response = await axios.post(
      `${AI_SERVICE_URL}/api/recommendations`,
      {
        userId,
        requestType: 'personalized',
        limit,
        context: {
          userBehavior: { purchaseHistory, wishlistItems, recentlyViewed },
        },
      },
      { headers: aiHeaders(), timeout: 12000 }
    );
    productIds       = response.data.recommendations || [];
    recType          = response.data.type            || 'recommended_for_you';
    catWeightsFromAI = response.data.category_weights || {};
  } catch (err) {
    console.error('FastAPI call failed (my-recommendations):', err.message);
  }

  // 5. Resolve MongoDB product objects (preserving FastAPI's ranking order)
  let products = [];
  if (productIds.length > 0) {
    const raw = await Product.find({ _id: { $in: productIds }, status: 'active' })
      .select('name category price images shortDescription discount rating')
      .populate('category', 'name');

    const rankMap = {};
    productIds.forEach((id, i) => { rankMap[id] = i; });
    products = raw
      .sort((a, b) => (rankMap[a._id.toString()] ?? 99) - (rankMap[b._id.toString()] ?? 99));
  }

  // 6. Fallback to trending if FastAPI returned nothing
  if (products.length === 0) {
    products = await Product.getTrending(limit);
    recType  = 'trending_fallback';
  }

  // 7. Print recommendations to terminal
  console.log('\n========================================');
  console.log(`  AI RECOMMENDATIONS  |  user: ${userId}`);
  console.log(`  type: ${recType}  |  count: ${products.length}`);
  console.log('========================================');
  products.forEach((p, i) => {
    const cat   = p.category?.name || p.category || 'Uncategorized';
    const price = `${p.price || 0}`;
    console.log(`  ${String(i + 1).padStart(2, ' ')}. ${p.name}  [${cat}]  $${price}`);
  });
  console.log('========================================\n');

  return res.status(200).json({
    success: true,
    data: {
      type:         recType,
      isPersonalized: !isNewUser,
      userProfile: {
        totalOrders:    orders.length,
        itemsPurchased: purchaseHistory.length,
        wishlistCount:  wishlistItems.length,
        viewCount:      recentlyViewed.length,
      },
      recommendations: products.map((p) => ({
        _id:              p._id,
        name:             p.name,
        category:         p.category?.name || p.category || 'Uncategorized',
        price:            p.price,
        discount:         p.discount || 0,
        rating:           p.rating?.average || 0,
        image:            p.images?.[0]?.url || null,
        shortDescription: p.shortDescription || '',
      })),
      count: products.length,
    },
  });
});

// ─── GET /api/v1/ai/health  (public) ────────────────────────────────────────
exports.checkHealth = catchAsync(async (req, res) => {
  try {
    const response = await axios.get(`${AI_SERVICE_URL}/health`, { timeout: 5000 });
    return res.status(200).json({
      success: true,
      aiService: 'connected',
      status: response.data,
    });
  } catch {
    return res.status(200).json({
      success: true,
      aiService: 'disconnected',
      fallback: 'trending_products',
    });
  }
});
