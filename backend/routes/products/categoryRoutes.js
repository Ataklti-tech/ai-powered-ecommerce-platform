const express = require("express");
const router = express.Router();
const categoryController = require("./../../controllers/products/categoryController");
const { protect, restrictTo } = require("./../../middleware/auth/authenticate");

// all available categories - admin and user
router.get("/", categoryController.getAllCategories);

// create a category - only admin
router.post(
  "/create-category",
  protect,
  // restrictTo("admin"),
  categoryController.createCategory
);

// get a single category by category id
router.post("/:id", categoryController.getCategory);

// get category by slug
// router.get();
// update category
//

module.exports = router;
