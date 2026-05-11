const catchAsync = require('../utils/constants/catchAsync');
const Product = require('../models/productModel');
const User = require('../models/userModel');

exports.getPublicStats = catchAsync(async (req, res) => {
  const [productCount, userCount] = await Promise.all([
    Product.countDocuments({ status: 'active' }),
    User.countDocuments({ active: true }),
  ]);

  res.status(200).json({
    status: 'success',
    data: { productCount, userCount },
  });
});
