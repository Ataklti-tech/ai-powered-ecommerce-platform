const Category = require("./../../models/categoryModel");
const Product = require("./../../models/productModel");
const catchAsync = require("./../../utils/constants/catchAsync");
const AppError = require("./../../utils/constants/appError");
const APIFeatures = require("./../../utils/constants/apifeatures");

// creating category (admin only)
exports.createCategory = catchAsync(async (req, res, next) => {
  const { name, description, image } = req.body;

  if (!name || !description) {
    return next(new AppError("Category name and description are required"));
  }
  const existingCategory = await Category.findOne({
    name: { $regex: name, $options: "i" },
  });

  if (existingCategory) {
    return next(new AppError("Category with this name already exists"));
  }

  // generate slug from name
  const slug = name
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");

  const category = await Category.create({
    name,
    description,
    slug,
    image,
  });

  res.status(201).json({
    success: true,
    message: "Category created successfully",
    data: category,
  });
});

// getting all categories
exports.getAllCategories = catchAsync(async (req, res, next) => {
  const apiFeatures = new APIFeatures(Category.find(), req.query)
    .search()
    .filter()
    .paginate()
    .limitFields();

  const categories = await apiFeatures.query;
  const totalCategories = await Category.countDocuments();

  res.status(200).json({
    status: "success",
    count: categories.length,
    totalCategories,
    data: categories,
  });
});

// get category by id
exports.getCategory = catchAsync(async (req, res, next) => {
  const { categoryId } = req.params;
  const category = await Category.findById(categoryId).populate("name slug");

  if (!category) {
    return next(new AppError("Category not found", 404));
  }

  // get product count
  const productCount = await Product.countDocuments({
    category: categoryId,
    status: "active",
  });
  // get featured products inside the category
  const featuredProducts = await Product.find({
    category: categoryId,
  })
    .select("name price image discount rating")
    .limit(5);

  res.status(200).json({
    success: true,
    date: {
      ...category.toObject(),
      productCount,
      featuredProducts,
    },
  });
});

// get category by slug
exports.getCategoryBySlug = catchAsync(async (req, res, next) => {
  const { slug } = req.params;
  const category = await Category.findOne({
    slug,
  }).populate("name slug");

  if (!category) {
    return next(new AppError("Category not found", 404));
  }
  // get product count
  const productCount = await Product.countDocuments({
    category: category._id,
    status: "active",
  });

  res.status(200).json({
    success: true,
    data: {
      ...category.toObject(),
      productCount,
    },
  });
});

// update category
exports.updateCategory = catchAsync(async (req, res, next) => {
  const { categoryId } = req.params;
  const { name, description, image } = req.body;

  const category = await Category.findById(categoryId);
  if (!category) {
    return next(new AppError("Category not found", 404));
  }

  // check for duplicate name if name is being updated
  if (name && !category.name) {
    const existingCategory = await Category.findOne({
      name: { $regex: name, $options: "i" },
      _id: { $ne: categoryId },
    });
    if (existingCategory) {
      return next(new AppError("Category with this name already exists", 400));
    }

    // Update name and slug
    category.name = name;
    category.slug = name
      .toLowerCase()
      .replace(/[^\w\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-");
  }

  // Update other fields
  if (description) category.description = description;

  if (image) category.image = image;

  await category.save();

  res.status(200).json({
    success: true,
    message: "Category updated successfully",
    data: category,
  });
});

// deleting category (admin only)
exports.deleteCategory = catchAsync(async (req, res, next) => {
  const { categoryId } = req.params;
  const { moveTo } = req.query;

  const category = await Category.findById(categoryId);

  if (!category) {
    return next(new AppError("Category not found", 404));
  }

  const productCount = await Product.countDocuments({ category: categoryId });

  // if products exists and no moveTo specified, return error
  if (productCount > 0 && !moveTo) {
    return next(new AppError(`Category has ${productCount} products`, 400));
  }
  // If moveTo is specified, move products
  if (moveTo) {
    const newCategory = await Category.findById(moveTo);
    if (!newCategory) {
      return next(new ErrorHandler("Target category not found", 404));
    }

    await Product.updateMany({ category: categoryId }, { category: moveTo });
  }

  // Delete category
  await Category.findByIdAndDelete(categoryId);

  res.status(200).json({
    success: true,
    message: "Category deleted successfully",
  });
});

// get category hierarchy
// exports.getCategoryHierarchy

// get subcategories by parent

// Search categories
exports.searchCategories = catchAsync(async (req, res, next) => {
  const { query } = req.query;

  if (!query || query.length < 2) {
    return next(
      new ErrorHandler("Search query must be at least 2 characters", 400)
    );
  }

  const categories = await Category.find({
    $or: [
      { name: { $regex: query, $options: "i" } },
      { description: { $regex: query, $options: "i" } },
      { slug: { $regex: query, $options: "i" } },
    ],
  })
    .limit(20)
    .sort({ name: 1 });

  res.status(200).json({
    success: true,
    count: categories.length,
    data: categories,
  });
});

// get popular categories
// get most popular categories by product count
// used for homepage/discovery
exports.getPopularCategories = catchAsync(async (req, res, next) => {
  const apiFeatures = APIFeatures(
    Category.find({ isActive: true }),
    req.query
  ).limit();

  const category = await apiFeatures.query;
  const totalCategories = await Category.countDocuments();
  // get product count for each category
  const categoriesWithCount = await Promise.all(
    category.map(async (category) => {
      const productCount = await Product.countDocuments({
        category: category._id,
        status: "active",
      });
    })
  );
  const popular = categoriesWithCount
    .sort((a, b) => b.productCount - a.productCount)
    .slice(0, limit);

  res.status(200).json({
    success: true,
    count: popular.length,
    data: popular,
  });
});

// get category with products
exports.getCategoryWithProducts = catchAsync(async (req, res, next) => {
  const { categoryId } = req.params;
  const category = await Category.findById(categoryId);

  if (!category) {
    return next(new AppError("Category not found", 404));
  }

  const products = await Product.find({
    category: categoryId,
    status: "active",
  }).select("name price image discount rating isFeatured");

  const totalProducts = await Product.countDocuments({
    category: categoryId,
    status: "active",
  });

  res.status(200).json({
    success: true,
    category: {
      _id: category._id,
      name: category.name,
      slug: category.slug,
      description: category.description,
      image: category.image,
    },
    count: products.length,
    totalProducts,
    data: products,
  });
});

// updating multiple categories at once
// exports.bulkUpdateCategories;

// get category statistics
exports.getCategoryStatistics = catchAsync(async (req, res, next) => {
  const totalCategories = await Category.countDocuments();
  const activeCategories = await Category.countDocuments({ isActive: true });

  const allCategories = await Category.find();

  const categoriesWithCounts = await Promise.all(
    allCategories.map(async (cat) => {
      const count = await Product.countDocuments({
        category: cat._id,
        status: "active",
      });
      return { name: cat.name, count };
    })
  );

  const topCategories = categoriesWithCounts
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  const totalProducts = await Product.countDocuments({ status: "active" });

  res.status(200).json({
    success: true,
    data: {
      totalCategories,
      activeCategories,
      totalProducts,
      totalCategories,
    },
  });
});

// reordering categories
// change display order of categories, used for admin to organize navigation
