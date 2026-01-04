const User = require("./../../models/userModel");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const catchAsync = require("./../../utils/constants/catchAsync");
const AppError = require("./../../utils/constants/appError");
const { protect } = require("./../../middleware/auth/authenticate");
const sendEmail = require("./../../services/email/emailService");

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

exports.signup = catchAsync(async (req, res, next) => {
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
  });

  createSendToken(newUser, 201, res);
});

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  // 1. Check if email and password exists
  if (!email || !password) {
    return next(new AppError("Please provide email and password", 400));
  }
  // 2. Check if user exists and password is correct
  const user = await User.findOne({
    email,
  }).select("+password");
  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError("Incorrect email or password", 401));
  }
  // 3. if everything is ok, send token to client
  createSendToken(user, 200, res);
});

// exports.protect = catchAsync(async (req, res, next) => {
//   // 1. Getting token check if it's there
//   let token;
//   if (
//     req.headers.authorization &&
//     req.headers.authorization.startswITH("Bearer")
//   ) {
//     token = req.headers.authorization.split(" ")[1];
//   }
//   console.log(token);
//   if (!token) {
//     return next(
//       new AppError("You are not logged in! Please login to get access", 400)
//     );
//   }

//   // 2. Verification token2
//   const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
//   console.log(decoded);
//   // 3. Check if user still exists
//   const currentUser = await User.findById(decoded.id);
//   if (!currentUser) {
//     return next(
//       new AppError("The user belonging to this token no longer exists", 401)
//     );
//   }

//   // 4. Check if user changed password after the token was issued
//   if (currentUser.changedPasswordAfter(decoded.iat)) {
//     return next(
//       new AppError("User recently changed password! Please login again", 401)
//     );
//   }

//   // Grant Access to protected routes
//   req.user = currentUser;
//   next();
// });
// exports.restrictTo = (...roles) => {
//   return (req, res, next) => {
//     // Roles is an array ['admin', 'lead-guide']
//     if (!roles.includes(req.user.role)) {
//       return next(
//         new AppError("You do not have permission to perform this action", 403)
//       );
//     }
//     next();
//   };
// };

exports.forgotPassword = catchAsync(async (req, res, next) => {
  // 1. Get user based on POSTED email
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return next(new AppError("There is no user with email address", 404));
  }
  // 2. Generate the random reset token
  const resetToken = await user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });

  // 3. Send it to user's email
  const resetURL = `${req.protocol}://${req.get(
    "host"
  )}/api/v1/auth/resetPassword/${resetToken}`;

  const message = `Forgot your password? Submit a PATCH request with your new password and passwordConfirm to: ${resetURL}.\nIf you didn't forget your password, please ignore this email`;

  try {
    await sendEmail({
      email: user.email,
      subject: "Your password reset token (valid for 10 minutes)",
      message,
    });

    res.status(200).json({
      status: "success",
      message: "Token send to email",
    });
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });

    return next(
      new AppError("There was an error sending the mail. Try again later")
    );
  }
});

// After forgot password - resetPassword comes
exports.resetPassword = catchAsync(async (req, res, next) => {
  // 1. Get user based on the token
  const hashedToken = crypto
    .createHash("sha256")
    .update(req.params.token)
    .digest("hex");

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });
  // 2. if token has not expired, and there is a user, set the new password
  if (!user) {
    return next(new AppError("Token is invalid or expires", 400));
  }
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  user.passwordChangedAt = Date.now();
  await user.save();
  // 3. Update changePasswordAt property for the user

  // 4. Log the user in, send JWT
  createSendToken(user, 200, res);
});

exports.updatePassword = catchAsync(async (req, res, next) => {
  // 1. Get user from collection/database
  const user = await User.findById(req.user.id).select("+password");
  // 2. Check if posted current password is correct
  if (!(await user.correctPassword(req.body.passwordCurrent, user.password))) {
    return next(new AppError("Your current password is wrong.", 401));
  }
  // 3. If so, update password
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  await user.save();
  //  User.findByIdAndUpdate will not work as intended
  // 4. Log user in, send JWT
  createSendToken(user, 200, res);
});
