const User = require("./../../models/userModel");
const catchAsync = require("./../../utils/constants/catchAsync");
const AppError = require("./../../utils/constants/appError");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");
const signToken = (id) => {
  return jwt.sign({ id: id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

const createSendToken = (user, statusCode, res) => {
  const token = signToken(user._id);

  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 1000
    ),
    httpOnly: true,
  };
  if (process.env.NODE_ENV === "production") cookieOptions.secure = true;
  res.cookie("jwt", token, cookieOptions);

  // Remove password from output
  user.password = undefined;

  res.status(statusCode).json({
    status: "Success",
    token,
    data: {
      user,
    },
  });
};

// Getting all users of the app
// function to get paginated list of users
exports.getAllUsers = catchAsync(async (req, resizeBy, next) => {
  // set up pagination parameters
  const page = req.query.page || 1;
  const limit = req.query.limit || 10;
  const skip = (page - 1) * limit;

  // fetching users excluding passwords, with pagination and sorting
  const users = User.find()
    .select("-password")
    .skip(skip)
    .limit(limit)
    .sort({ createdAt: -1 });
  // send status
  req.status(200).json({
    status: "success",
    results: users.length,
    date: {
      users,
    },
  });
});

// Get single user by ID
exports.getUser = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.params.id).select("-password");
  if (!user) {
    return next(new AppError("User not found", 404));
  }
  res.status(200).json({
    success: true,
    data: user,
  });
});

// Create User / Register
exports.createUser = catchAsync(async (req, res, next) => {
  const {
    firstName,
    lastName,
    email,
    password,
    passwordConfirm,
    phone,
    addresses,
  } = req.body;

  // Check if user already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return next(new AppError("User already exists with this email", 400));
  }

  const user = await User.create({
    firstName,
    lastName,
    email,
    password,
    passwordConfirm,
    phone,
    addresses,
  });

  // let us check/verify collection existence
  const collections = await mongoose.connection.db.listCollections().toArray();
  const collectionNames = collections.map((col) => col.name);
  console.log("Available collections:", collectionNames);

  createSendToken(user, 201, res);
});

// Get current logged in user
exports.getCurrentUser = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.user.id).select("-password");

  res.status(200).json({
    success: true,
    data: user,
  });
});

// Get user by email
exports.getUserByEmail = catchAsync(async (req, res, next) => {
  const { email } = req.params;

  const user = await User.findOne({ email }).select("-password");
  if (!user) {
    return next(new AppError("User not found", 404));
  }

  res.status(200).json({
    success: true,
    data: user,
  });
});

// Search users
exports.searchUsers = catchAsync(async (req, res, next) => {
  const { searchTerm } = req.query;
  if (!searchTerm) {
    return next(new AppError("Search term is required", 400));
  }

  const users = await User.find({
    $or: [
      { firstName: { $regex: searchTerm, $options: "i" } },
      { lastName: { $regex: searchTerm, $options: "i" } },
      { email: { $regex: searchTerm, $options: "i" } },
      { phone: { $regex: searchTerm, $options: "i" } },
    ],
  })
    .select("-password")
    .limit(50);

  res.status(200).json({
    success: true,
    count: users.length,
    data: users,
  });
});

// Update user profile
exports.updateUserProfile = catchAsync(async (req, res, next) => {
  const { firstName, lastName, phone } = req.body;

  const user = await User.findByIdAndUpdate(
    req.user.id,
    { firstName, lastName, phone },
    { new: true, runValidators: true }
  ).select("-password");

  res.status(200).json({
    success: true,
    message: "Profile updated successfully",
    data: user,
  });
});

// Update user email
exports.updateUserEmail = catchAsync(async (req, res, next) => {
  const { newEmail, password } = req.body;
  if (!newEmail || !password) {
    return next(new AppError("New email and password are required", 400));
  }

  const user = await User.findById(req.user.id);

  // verify password before updating email
  const isPasswordValid = await user.comparePassword(password);
  if (!isPasswordValid) {
    return next(new AppError("Incorrect password", 401));
  }
  // check if new email already exists
  const existingUser = await User.findOne({ email: newEmail });
  if (existingUser) {
    return next(new AppError("Email already in use", 400));
  }

  user.email = newEmail;
  user.emailVerified = false;
  user.emailVerificationToken = crypto.randomBytes(32).toString("hex");
  user.emailVerificationExpiry = Date.now() + 24 * 60 * 60 * 1000;

  await user.save();

  // Send verification email
  const verificationUrl = `${process.env.FRONTEND_URL}/verify-email/${user.emailVerificationToken}`;
  const message = `Click the link to verify your new email: ${verificationUrl}`;

  await sendEmail({
    email: newEmail,
    subject: "Email Verification",
    message,
  });

  res.status(200).json({
    success: true,
    message: "Email updated. Please verify your new email address.",
    data: {
      email: user.email,
      emailVerified: user.emailVerified,
    },
  });
});
// Update User Username
exports.updateUsername = catchAsync(async (req, res, next) => {
  const { newUsername, password } = req.body;

  if (!newUsername || !password) {
    return next(new AppError("New username and password are required", 400));
  }

  const user = await User.findById(req.user.id);

  // Verify password
  const isPasswordValid = await user.comparePassword(password);
  if (!isPasswordValid) {
    return next(new AppError("Incorrect password", 401));
  }

  // Check if username already exists
  const existingUser = await User.findOne({ username: newUsername });
  if (existingUser && existingUser._id.toString() !== req.user.id) {
    return next(new AppError("Username already taken", 400));
  }

  user.username = newUsername;
  await user.save();

  res.status(200).json({
    success: true,
    message: "Username updated successfully",
    data: {
      username: user.username,
    },
  });
});

// Update User Password
exports.updatePassword = catchAsync(async (req, res, next) => {
  const { oldPassword, newPassword, confirmPassword } = req.body;

  if (!oldPassword || !newPassword || !confirmPassword) {
    return next(
      new AppError(
        "Old password, new password, and confirm password are required",
        400
      )
    );
  }

  if (newPassword !== confirmPassword) {
    return next(new AppError("Passwords do not match", 400));
  }

  if (newPassword.length < 6) {
    return next(
      new AppError("New password must be at least 6 characters long", 400)
    );
  }

  const user = await User.findById(req.user.id);

  // Verify old password
  const isPasswordValid = await user.comparePassword(oldPassword);
  if (!isPasswordValid) {
    return next(new AppError("Old password is incorrect", 401));
  }

  user.password = newPassword;
  await user.save();

  sendToken(user, 200, res, "Password updated successfully");
});

// Update User Address
exports.updateUserAddress = catchAsync(async (req, res, next) => {
  const { street, city, state, postalCode, country, isDefault } = req.body;

  if (!street || !city || !state || !postalCode || !country) {
    return next(new AppError("All address fields are required", 400));
  }

  const user = await User.findById(req.user.id);

  const newAddress = {
    street,
    city,
    state,
    postalCode,
    country,
    isDefault: isDefault || false,
  };

  if (isDefault) {
    user.addresses.forEach((addr) => (addr.isDefault = false));
  }

  user.addresses.push(newAddress);
  await user.save();

  res.status(200).json({
    success: true,
    message: "Address added successfully",
    data: user.addresses,
  });
});

// Get User Addresses
exports.getUserAddresses = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.user.id);

  if (!user) {
    return next(new AppError("User not found", 404));
  }

  res.status(200).json({
    success: true,
    count: user.addresses.length,
    data: user.addresses,
  });
});

// Update Specific Address
exports.updateSpecificAddress = catchAsync(async (req, res, next) => {
  const { addressId } = req.params;
  const { street, city, state, postalCode, country, isDefault } = req.body;

  const user = await User.findById(req.user.id);

  if (!user) {
    return next(new AppError("User not found", 404));
  }

  const addressIndex = user.addresses.findIndex(
    (addr) => addr._id.toString() === addressId
  );

  if (addressIndex === -1) {
    return next(new AppError("Address not found", 404));
  }

  if (street) user.addresses[addressIndex].street = street;
  if (city) user.addresses[addressIndex].city = city;
  if (state) user.addresses[addressIndex].state = state;
  if (postalCode) user.addresses[addressIndex].postalCode = postalCode;
  if (country) user.addresses[addressIndex].country = country;

  if (isDefault) {
    user.addresses.forEach((addr) => (addr.isDefault = false));
    user.addresses[addressIndex].isDefault = true;
  }

  await user.save();

  res.status(200).json({
    success: true,
    message: "Address updated successfully",
    data: user.addresses[addressIndex],
  });
});

// Delete User Address
exports.deleteUserAddress = catchAsync(async (req, res, next) => {
  const { addressId } = req.params;

  const user = await User.findById(req.user.id);

  if (!user) {
    return next(new AppError("User not found", 404));
  }

  user.addresses = user.addresses.filter(
    (addr) => addr._id.toString() !== addressId
  );

  await user.save();

  res.status(200).json({
    success: true,
    message: "Address deleted successfully",
    data: user.addresses,
  });
});

// Update User Phone
exports.updateUserPhone = catchAsync(async (req, res, next) => {
  const { phone, password } = req.body;

  if (!phone || !password) {
    return next(new AppError("Phone and password are required", 400));
  }

  const user = await User.findById(req.user.id);

  // Verify password
  const isPasswordValid = await user.comparePassword(password);
  if (!isPasswordValid) {
    return next(new AppError("Incorrect password", 401));
  }

  user.phone = phone;
  await user.save();

  res.status(200).json({
    success: true,
    message: "Phone number updated successfully",
    data: {
      phone: user.phone,
    },
  });
});

// Update User Profile Picture
exports.updateUserProfilePicture = catchAsync(async (req, res, next) => {
  if (!req.file) {
    return next(new AppError("Please upload an image", 400));
  }

  const user = await User.findById(req.user.id);

  user.profilePicture = req.file.path || req.file.filename;
  await user.save();

  res.status(200).json({
    success: true,
    message: "Profile picture updated successfully",
    data: {
      profilePicture: user.profilePicture,
    },
  });
});

// Update Other User Data (Admin Only)
exports.updateUserData = catchAsync(async (req, res, next) => {
  const { firstName, lastName, email, phone, role, isActive } = req.body;
  const userId = req.params.id;

  const user = await User.findById(userId);

  if (!user) {
    return next(new AppError("User not found", 404));
  }

  // Check email uniqueness if changing
  if (email && email !== user.email) {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return next(new AppError("Email already in use", 400));
    }
    user.email = email;
  }

  if (firstName) user.firstName = firstName;
  if (lastName) user.lastName = lastName;
  if (phone) user.phone = phone;
  if (role) user.role = role;
  if (isActive !== undefined) user.isActive = isActive;

  await user.save();

  res.status(200).json({
    success: true,
    message: "User data updated successfully",
    data: user,
  });
});

// Delete User (Admin Only or Self)
exports.deleteUser = catchAsync(async (req, res, next) => {
  const userId = req.params.id;

  // Check if user is deleting themselves or is admin
  if (req.user.id !== userId && req.user.role !== "admin") {
    return next(new AppError("Not authorized to delete this user", 403));
  }

  const user = await User.findByIdAndDelete(userId);

  if (!user) {
    return next(new AppError("User not found", 404));
  }

  res.status(200).json({
    success: true,
    message: "User deleted successfully",
  });
});

// Soft Delete User Account (User Deactivates Account)
exports.deactivateUserAccount = catchAsync(async (req, res, next) => {
  const { password } = req.body;

  if (!password) {
    return next(new AppError("Password is required", 400));
  }

  const user = await User.findById(req.user.id);

  // Verify password
  const isPasswordValid = await user.comparePassword(password);
  if (!isPasswordValid) {
    return next(new AppError("Incorrect password", 401));
  }

  user.isActive = false;
  user.deactivatedAt = new Date();
  await user.save();

  res.status(200).json({
    success: true,
    message: "Account deactivated successfully",
  });
});

// Reactivate User Account
exports.reactivateUserAccount = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.user.id);

  if (!user) {
    return next(new AppError("User not found", 404));
  }

  user.isActive = true;
  user.deactivatedAt = null;
  await user.save();

  sendToken(user, 200, res, "Account reactivated successfully");
});

// Add User to Wishlist
exports.addToWishlist = catchAsync(async (req, res, next) => {
  const { productId } = req.body;

  if (!productId) {
    return next(new AppError("Product ID is required", 400));
  }

  const user = await User.findById(req.user.id);

  if (user.wishlist.includes(productId)) {
    return next(new AppError("Product already in wishlist", 400));
  }

  user.wishlist.push(productId);
  await user.save();

  res.status(200).json({
    success: true,
    message: "Product added to wishlist",
    data: user.wishlist,
  });
});

// Remove from Wishlist
exports.removeFromWishlist = catchAsync(async (req, res, next) => {
  const { productId } = req.params;

  const user = await User.findById(req.user.id);

  user.wishlist = user.wishlist.filter((id) => id.toString() !== productId);
  await user.save();

  res.status(200).json({
    success: true,
    message: "Product removed from wishlist",
    data: user.wishlist,
  });
});

// Get User Wishlist
exports.getWishlist = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.user.id).populate("wishlist");

  res.status(200).json({
    success: true,
    count: user.wishlist.length,
    data: user.wishlist,
  });
});

// Add User to Favorites
exports.addToFavorites = catchAsync(async (req, res, next) => {
  const { productId } = req.body;

  if (!productId) {
    return next(new AppError("Product ID is required", 400));
  }

  const user = await User.findById(req.user.id);

  if (user.favorites.includes(productId)) {
    return next(new AppError("Product already in favorites", 400));
  }

  user.favorites.push(productId);
  await user.save();

  res.status(200).json({
    success: true,
    message: "Product added to favorites",
    data: user.favorites,
  });
});

// Remove from Favorites
exports.removeFromFavorites = catchAsync(async (req, res, next) => {
  const { productId } = req.params;

  const user = await User.findById(req.user.id);

  user.favorites = user.favorites.filter((id) => id.toString() !== productId);
  await user.save();

  res.status(200).json({
    success: true,
    message: "Product removed from favorites",
    data: user.favorites,
  });
});

// Get User Favorites
exports.getFavorites = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.user.id).populate("favorites");

  res.status(200).json({
    success: true,
    count: user.favorites.length,
    data: user.favorites,
  });
});

// Update User Preferences
exports.updateUserPreferences = catchAsync(async (req, res, next) => {
  const { emailNotifications, smsNotifications, newsletter, theme } = req.body;

  const user = await User.findByIdAndUpdate(
    req.user.id,
    {
      "preferences.emailNotifications": emailNotifications,
      "preferences.smsNotifications": smsNotifications,
      "preferences.newsletter": newsletter,
      "preferences.theme": theme,
    },
    { new: true, runValidators: true }
  ).select("-password");

  res.status(200).json({
    success: true,
    message: "Preferences updated successfully",
    data: user.preferences,
  });
});

// Get User Statistics (Admin Only)
exports.getUserStatistics = catchAsync(async (req, res, next) => {
  const totalUsers = await User.countDocuments();
  const activeUsers = await User.countDocuments({ isActive: true });
  const inactiveUsers = await User.countDocuments({ isActive: false });
  const adminUsers = await User.countDocuments({ role: "admin" });
  const customerUsers = await User.countDocuments({ role: "customer" });

  const usersCreatedThisMonth = await User.countDocuments({
    createdAt: {
      $gte: new Date(new Date().setDate(1)),
      $lt: new Date(),
    },
  });

  res.status(200).json({
    success: true,
    data: {
      totalUsers,
      activeUsers,
      inactiveUsers,
      adminUsers,
      customerUsers,
      usersCreatedThisMonth,
    },
  });
});

// Get User Orders
exports.getUserOrders = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.user.id).populate("orders");

  if (!user) {
    return next(new AppError("User not found", 404));
  }

  res.status(200).json({
    success: true,
    count: user.orders.length,
    data: user.orders,
  });
});

// Get User Reviews
exports.getUserReviews = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.user.id).populate("reviews");

  if (!user) {
    return next(new AppError("User not found", 404));
  }

  res.status(200).json({
    success: true,
    count: user.reviews.length,
    data: user.reviews,
  });
});

// Toggle User Role (Admin Only)
exports.toggleUserRole = catchAsync(async (req, res, next) => {
  const userId = req.params.id;

  const user = await User.findById(userId);

  if (!user) {
    return next(new AppError("User not found", 404));
  }

  user.role = user.role === "admin" ? "customer" : "admin";
  await user.save();

  res.status(200).json({
    success: true,
    message: `User role changed to ${user.role}`,
    data: {
      id: user._id,
      role: user.role,
    },
  });
});

// Export User Data (GDPR)
exports.exportUserData = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.user.id);

  if (!user) {
    return next(new AppError("User not found", 404));
  }

  const userData = {
    personalInfo: {
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone,
      username: user.username,
    },
    addresses: user.addresses,
    preferences: user.preferences,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };

  res.status(200).json({
    success: true,
    message: "User data exported successfully",
    data: userData,
  });
});
