const express = require("express");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
const helmet = require("helmet");
const mongoSanitize = require("express-mongo-sanitize");
const hpp = require("hpp");
// const xss = require("xss-clean");

const AppError = require("./utils/constants/appError");
// const globalErrorHandler = require("./controllers/auth/errorController");

const userRouter = require("./routes/auth/userRoutes");
const authRouter = require("./routes/auth/authRoutes");
const productRouter = require("./routes/products/productRoutes");
const categoryRouter = require("./routes/products/categoryRoutes");
const orderRouter = require("./routes/orders/orderRoutes");
// const paymentRouter = require("./routes/payments/paymentRoutes");
const cartRouter = require("./routes/orders/cartRoutes");
const reviewRouter = require("./routes/products/reviewRoutes");
const wishlistRouter = require("./routes/products/wishlistRoutes");
const couponRouter = require("./routes/orders/couponRoutes");

const userActivityRouter = require("./routes/Analytics/userActivityRoutes");
// Importing the rateLimiter (apiLimiter, authLimiter, ...)
// const {apiLimiter} = require("./middleware/security/rateLimiter");

const app = express();

// 1. Global Middlewares
// Set Security HTTP header
app.use(helmet());

// Development logging
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000,
  message: "Too many requests from this IP, please try again in an hour",
});

app.use("/api", limiter);

// Body parser, reading data from body into req.body
// Middleware
// middleware to parse JSON bodies
// This middleware is used to parse incoming request bodies in a middleware before your handlers, available under the req.body property.
// It is based on body-parser, but it is built into Express 4.16.

app.use(express.json({ limit: "10kb" }));

// Data sanitization against NoSql query injection
// app.use(mongoSanitize());
// Data sanitization against XRS
// app.use(xss());

// Prevent parameter pollution
app.use(
  hpp({
    whitelist: [],
  })
);

// Middleware function
app.use((req, res, next) => {
  console.log("Hello from the middleware");
  next();
});

// Serving static files
app.use(express.static(`${__dirname}/public`));

app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  console.log(req.headers);
  next();
});

// Routes
app.use("/api/v1/users", userRouter);
app.use("/api/v1/products", productRouter);
app.use("/api/v1/auth", authRouter);
app.use("/api/v1/order", orderRouter);
app.use("/api/v1/cart", cartRouter);
app.use("/api/v1/review", reviewRouter);
app.use("/api/v1/wishlist", wishlistRouter);
app.use("/api/v1/categories", categoryRouter);
app.use("/api/v1/coupons", couponRouter);
app.use("/api/activities", userActivityRouter);

app.all(/.*/, (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server`, 404));
});

// app.use(globalErrorHandler);

module.exports = app;
