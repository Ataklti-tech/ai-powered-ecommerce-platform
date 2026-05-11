const express = require('express');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const cors = require('cors');

const AppError = require('./utils/constants/appError');
const globalErrorHandler = require('./controllers/auth/errorController');

const userRouter = require('./routes/auth/userRoutes');
const authRouter = require('./routes/auth/authRoutes');
const productRouter = require('./routes/products/productRoutes');
const categoryRouter = require('./routes/products/categoryRoutes');
const orderRouter = require('./routes/orders/orderRoutes');
const cartRouter = require('./routes/orders/cartRoutes');
const reviewRouter = require('./routes/products/reviewRoutes');
const wishlistRouter = require('./routes/products/wishlistRoutes');
const couponRouter = require('./routes/orders/couponRoutes');
const userActivityRouter = require('./routes/Analytics/userActivityRoutes');
const aiRouter = require('./routes/ai/aiRoutes');
const adminRouter = require('./routes/admin/adminRoutes');
const paymentRouter = require('./routes/payments/paymentRoutes');
const webhookRouter = require('./routes/payments/paymentWebhookRoutes');
const statsRouter = require('./routes/statsRoutes');

const app = express();

// ── 1. Security HTTP headers ────────────────────────────────────────────────
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' }, // allow S3 images
  })
);

// ── 2. CORS ─────────────────────────────────────────────────────────────────
// Use a function so env vars are read at request time (after dotenv has run).
// In development, all localhost ports are allowed (Vite auto-increments port).
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no Origin header (Postman, curl, mobile)
      if (!origin) return callback(null, true);

      const allowedOrigins = (
        process.env.ALLOWED_ORIGINS || 'http://localhost:5173'
      )
        .split(',')
        .map((o) => o.trim());

      const isDev = process.env.NODE_ENV !== 'production';
      const isLocalhost = /^http:\/\/localhost(:\d+)?$/.test(origin);

      if (allowedOrigins.includes(origin) || (isDev && isLocalhost)) {
        return callback(null, true);
      }

      callback(new Error(`CORS policy: origin ${origin} is not allowed`));
    },
    credentials: true,
  })
);

// ── 3. Rate limiting ─────────────────────────────────────────────────────────
const apiLimiter = rateLimit({
  max: 200,
  windowMs: 60 * 60 * 1000,
  message: 'Too many requests from this IP, please try again in an hour',
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  max: 20,
  windowMs: 15 * 60 * 1000,
  message: 'Too many auth attempts, please try again in 15 minutes',
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api', apiLimiter);
app.use('/api/v1/auth', authLimiter);

// ── 4. Body parser ───────────────────────────────────────────────────────────
// Increased limit to handle base64 images in JSON (form-data is handled by multer)
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ── 5. Data sanitization ─────────────────────────────────────────────────────
// express-mongo-sanitize and xss-clean both try to reassign req.query which is
// a read-only getter in Express 5. Sanitize only body/params manually.
app.use((req, _res, next) => {
  if (req.body) req.body = mongoSanitize.sanitize(req.body);
  if (req.params) req.params = mongoSanitize.sanitize(req.params);
  next();
});

// ── 6. Prevent parameter pollution ───────────────────────────────────────────
app.use(
  hpp({
    whitelist: ['price', 'rating', 'stock', 'category', 'sort', 'fields'],
  })
);

// ── 7. Development logging ────────────────────────────────────────────────────
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// ── 8. Static files ───────────────────────────────────────────────────────────
app.use(express.static(`${__dirname}/public`));

// ── 9. Attach request timestamp ──────────────────────────────────────────────
app.use((req, _res, next) => {
  req.requestTime = new Date().toISOString();
  next();
});

// ── 10. Health check ─────────────────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ── 11. API Routes ───────────────────────────────────────────────────────────
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/products', productRouter);
app.use('/api/v1/categories', categoryRouter);
app.use('/api/v1/order', orderRouter);
app.use('/api/v1/cart', cartRouter);
app.use('/api/v1/review', reviewRouter);
app.use('/api/v1/wishlist', wishlistRouter);
app.use('/api/v1/coupons', couponRouter);
app.use('/api/v1/ai', aiRouter);
app.use('/api/v1/admin', adminRouter);
app.use('/api/activities', userActivityRouter);
app.use('/api/v1/payments', paymentRouter);
app.use('/api/webhooks', webhookRouter);
app.use('/api/v1/stats', statsRouter);

// ── 12. 404 handler ───────────────────────────────────────────────────────────
app.all(/.*/, (req, _res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server`, 404));
});

// ── 13. Global error handler ──────────────────────────────────────────────────
app.use(globalErrorHandler);

module.exports = app;
