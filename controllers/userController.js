const userModel = require("../models/userModel");
const cartModel = require("../models/cartModel");
const couponModel = require("../models/couponModel");
const orderModel = require("../models/orderModel");
const addressModel = require("../models/addressModel");
const reviewModel = require("../models/reviewModel");
const catchAsyncError = require("../utils/catchAsyncError");
const ErrorHandler = require("../utils/errorHandler");
const APIFeatures = require("../utils/apiFeatures");

const sendData = (user, statusCode, res) => {
  const token = user.getJWTToken();

  res.status(statusCode).json({
    user,
    token,
  });
};

exports.register = catchAsyncError(async (req, res, next) => {
  console.log("user register", req.body);

  const user = await userModel.create(req.body);

  await cartModel.create({
    user: user._id,
    items: [],
  });
  sendData(user, 200, res);
});

// exports.getMyCoupon = catchAsyncError(async (req, res, next) => {
//   console.log("my coupons", req.userId);
//   const userId = req.userId;
//   const coupons = await couponModel.find({ user: userId });
//   res.status(200).json({ coupons });
// });

exports.login = catchAsyncError(async (req, res, next) => {
  console.log("user login", req.body);
  const { email, password } = req.body;

  if (!email || !password)
    return next(new ErrorHandler("Please enter your email and password", 400));

  const user = await userModel.findOne({ email, active: true }).select("+password");
  if (!user) {
    return next(new ErrorHandler("Invalid email or password", 401));
  }

  const isPasswordMatched = await user.comparePassword(password);
  if (!isPasswordMatched)
    return next(new ErrorHandler("Invalid email or password!", 401));

  sendData(user, 200, res);
});

exports.getProfile = catchAsyncError(async (req, res, next) => {
  console.log("user profile", req.userId);

  const user = await userModel.findById(req.userId);
  if (!user) {
    return next(new ErrorHandler("User not found.", 400));
  }

  res.status(200).json({
    user,
  });
});

exports.updateProfile = catchAsyncError(async (req, res, next) => {
  console.log("update profile", req.body);
  const { firstname, lastname, mobile_no } = req.body;

  const user = await userModel.findByIdAndUpdate(
    req.userId,
    { firstname, lastname, mobile_no },
    {
      new: true,
      runValidators: true,
      useFindAndModify: false,
    }
  );

  res.status(200).json({
    user,
  });
});

exports.updatePassword = catchAsyncError(async (req, res, next) => {
  console.log("reset password", req.body);
  const userId = req.userId;
  const { password, confirmPassword } = req.body;
  if (!password || !confirmPassword)
    return next(
      new ErrorHandler("Password or Confirm Password is required.", 400)
    );

  if (password !== confirmPassword)
    return next(new ErrorHandler("Please confirm your password,", 400));

  const user = await userModel.findOne({ _id: userId });

  if (!user) return new ErrorHandler("User Not Found.", 404);

  user.password = password;
  await user.save();
  res.status(203).json({ message: "Password Updated Successfully." });
});

exports.getAllUsers = catchAsyncError(async (req, res, next) => {
  const apiFeature = new APIFeatures(
    userModel.find().select({email: 1, firstname: 1, lastname: 1, mobile_no: 1,
    role: 1, active: 1}).sort({ createdAt: -1 }),
    req.query
  ).search("firstname");

  let users = await apiFeature.query;
  console.log("users", { users });
  let filteredUserCount = users.length;
  if (req.query.resultPerPage && req.query.currentPage) {
    apiFeature.pagination();

    console.log("filteredUserCount", filteredUserCount);
    users = await apiFeature.query.clone();
  }

  console.log("users", users);
  res.status(200).json({ users, filteredUserCount });
});

exports.deleteUser = catchAsyncError(async (req, res, next) => {
  const { id } = req.params;
  const user = await userModel.findOne({ _id: id });

  if (!user) {
    return next(new ErrorHandler("User Not found", 404));
  }

  const cart = await cartModel.findOne({ user: user._id });
  await cart.remove();
  await orderModel.deleteMany({ userId: id });
  await addressModel.deleteMany({ user: id });
  // await reviewModel.deleteMany({ user: id });
  // await couponModel.deleteMany({ user: id });
  await user.remove();

  res.status(200).json({
    message: "User Deleted Successfully.",
  });
});

exports.updateUser = catchAsyncError(async (req, res, next) => {
  console.log("user update", req.body);
  const { id } = req.params;
  console.log("user update admin", id);
  // const { firstname, lastname, mobile_no, role } = req.body;

  // const user = await userModel.findById(id);
  // if (!user) return next(new ErrorHandler("User not found.", 404));

  // user.firstname = firstname;
  // user.lastname = lastname;
  // user.mobile_no = mobile_no;
  // user.role = role;
  // await user.save();

  const user = await userModel.findByIdAndUpdate(id, req.body, {
    new: true,
    runValidators: true,
    useFindAndModify: false
  });
  if (!user) return next(new ErrorHandler("User not found.", 404));

  res.status(200).json({
    user,
  });
});

exports.getUser = catchAsyncError(async (req, res, next) => {
  const { id } = req.params;
  console.log("get user", id);
  const user = await userModel.findById(id).select("+dist_name +dist_email +active");

  if (!user) return next(new ErrorHandler("User not found.", 404));

  res.status(200).json({ user });
});
