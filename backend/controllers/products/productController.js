const catchAsync = require("../../utils/constants/catchAsync");
const Product = require("./../../models/productModel");
const APIFeatures = require("./../../utils/constants/apifeatures");

// Route handlers
// create product (admin only)
exports.createProduct = catchAsync(async (req, res, next) => {
  const product = await Product.create(req.body);
  res.status(201).json({
    success: true,
    message: "Product created successfully",
    data: product,
  });
});

// get all products
exports.getAllProducts = catchAsync(async (req, res) => {
  const apifeatures = new APIFeatures(Product.find(), req.query)
    .filter()
    .sort()
    .limitFields()
    .paginate();
  const products = await apifeatures.query;
  const totalProducts = await Product.countDocuments();

  res.status(200).json({
    success: true,
    count: products.length,
    totalProducts,
    data: products,
  });
});

// get a single product
exports.getProduct = catchAsync(async (req, res, next) => {
  const product = await Product.findById(req.params.id);
});
