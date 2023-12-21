const fs = require('fs');
const path = require('path');
const crypto = require("node:crypto");
const { default: mongoose } = require("mongoose");

const ErrorHandler = require("../utils/errorHandler");
const catchAsyncError = require("../utils/catchAsyncError");
const APIFeatures = require("../utils/apiFeatures");
const sendEmail = require("../utils/sendEmail");

const userModel = require("../models/userModel");
const cartModel = require("../models/cartModel");
const orderModel = require("../models/orderModel");
const addressModel = require("../models/addressModel");

const { updateParticipant } = require("./chatController");
const chatModel = require('../models/chatModel');

const sendData = (user, statusCode, res) => {
  const token = user.getJWTToken();

  res.status(statusCode).json({
    user,
    token,
  });
};

exports.register = catchAsyncError(async (req, res, next) => {
  console.log("user register", req.body);

  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    const user = (await userModel.create([req.body], { session }))[0];
    console.log({ user })

    await cartModel.create([{
      user: user._id,
      items: [],
    }], { session });

    const userDetails = {
      name: req.body.firstname + ' ' + req.body.lastname,
      password: req.body.password,
      dist_name: req.body.dist_name,
      dist_email: req.body.dist_email
    }
    const template = fs.readFileSync(path.join(__dirname + '/templates', "userRegister.html"), "utf-8");

    // /{{(\w+)}}/g - match {{Word}} globally
    const renderedTemplate = template.replace(/{{(\w+)}}/g, (match, key) => {
      console.log({ match, key })
      return userDetails[key] || match;
    });

    await sendEmail({
      email: user.email,
      subject: 'Successful Registration',
      message: renderedTemplate
    });

    await session.commitTransaction();
    sendData(user, 200, res);

  } catch (error) {
    await session.abortTransaction();
    next(new ErrorHandler(error.message, 400));

  } finally {
    session.endSession();
  }
});

exports.adminLogin = catchAsyncError(async (req, res, next) => {
  console.log("admin login", req.body);
  const { email, password } = req.body;

  if (!email || !password)
    return next(new ErrorHandler("Please enter your email and password", 400));

  const user = await userModel.findOne({ email }).select("+password +active");
  if (!user) {
    return next(new ErrorHandler("Invalid email or password", 401));
  }

  console.log({ user });
  if (user.active === false) {
    return next(new ErrorHandler("Your account is deactivated. Kindly reach out Manufacturer", 400));
  }
  const isPasswordMatched = await user.comparePassword(password);
  if (!isPasswordMatched)
    return next(new ErrorHandler("Invalid email or password!", 401));

  if (user.role !== 'admin') {
    return next(new ErrorHandler("Only Admin can access the portal.", 401));
  }
  sendData(user, 200, res);
});

exports.login = catchAsyncError(async (req, res, next) => {
  console.log("user login", req.body);
  const { email, password } = req.body;

  if (!email || !password)
    return next(new ErrorHandler("Please enter your email and password", 400));

  const user = await userModel.findOne({ email }).select("+password +active");
  if (!user) {
    return next(new ErrorHandler("Invalid email or password", 401));
  }

  console.log({ user });
  if (user.active === false) {
    return next(new ErrorHandler("Your account is deactivated. Kindly reach out Manufacturer", 400));
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

  await updateParticipant(user);
  res.status(200).json({
    user,
  });
});

exports.updateAdminProfile = catchAsyncError(async (req, res, next) => {
  console.log("update admin profile", req.body);
  const { firstname, lastname, mobile_no, email, password } = req.body;

  const user = await userModel.findById(req.userId);
  user.firstname = firstname;
  user.lastname = lastname;
  user.mobile_no = mobile_no;
  user.email = email;
  if (password) {
    user.password = password;
  }
  await user.save();

  res.status(200).json({
    message: "Profile Updated Successfully",
    user
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
    userModel.find({ role: 'user' }).select({
      email: 1, firstname: 1, lastname: 1, mobile_no: 1,
      active: 1, profile_img: 1
    }).sort({ createdAt: -1 }),
    req.query
  ).searchUser();

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

exports.getChatUser = catchAsyncError(async (req, res, next) => {
  const chatId = (await chatModel.distinct('user')).map(String);

  const apiFeature = new APIFeatures(
    userModel.find({ role: 'user', _id: { $nin: chatId } }).select({
      email: 1, firstname: 1, lastname: 1, mobile_no: 1,
      active: 1, profile_img: 1
    }).sort({ createdAt: -1 }),
    req.query
  ).searchUser();

  let users = await apiFeature.query;
  console.log("users", users, chatId);
  res.status(200).json({ users });
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

  await updateParticipant(user);
  res.status(200).json({ user });
});

exports.getUser = catchAsyncError(async (req, res, next) => {
  const { id } = req.params;
  console.log("get user", id);
  const user = await userModel.findById(id).select("+dist_name +dist_email +active +dist_mob_no");

  if (!user) return next(new ErrorHandler("User not found.", 404));

  res.status(200).json({ user });
});

// forget password
exports.forgotPassword = catchAsyncError(async (req, res, next) => {
  console.log("forgot password", req.body)
  const { email } = req.body;
  if (!email) {
    return next(new ErrorHandler("Please provide the email.", 400));
  }

  const user = await userModel.findOne({ email });
  if (!user) {
    return next(new ErrorHandler("User not found", 404));
  }
  // get resetPassword Token
  const resetToken = user.getResetPasswordToken();
  await user.save({ validateBeforeSave: false });
  console.log(req);
  // const resetPasswordUrl = `${process.env.FRONTEND_URL}/password/reset/${resetToken}`;
  console.log({ h: req.get("origin") })
  const resetPasswordUrl = `${req.get("origin")}/reset-password/${resetToken}`;
  console.log({ resetPasswordUrl })
  try {
    const template = fs.readFileSync(path.join(__dirname, "/templates/passwordReset.html"), "utf-8");

    // /{{(\w+)}}/g - match {{Word}} globally
    const renderedTemplate = template.replace(/{{(\w+)}}/g, (match, key) => {
      console.log({ match, key })
      return { resetPasswordUrl, firstname: user.firstname, lastname: user.lastname }[key] || match;
    });

    await sendEmail({
      email: user.email,
      subject: `Password Reset`,
      message: renderedTemplate
    });

    res.status(200).json({
      message: `Email sent to ${user.email} successfully.`,
    });
  } catch (error) {
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save({ validateBeforeSave: false });
    return next(new ErrorHandler(error.message, 500));
  }
});

// Reset password
exports.resetPassword = catchAsyncError(async (req, res, next) => {
  console.log("reset password", req.body);
  const { password, confirmPassword } = req.body;
  if (!password || !confirmPassword) {
    return next(new ErrorHandler("Please provide password and confirm password.", 400));
  }
  // creating hash token
  const resetPasswordToken = crypto
    .createHash("sha256")
    .update(req.params.token)
    .digest("hex");
  console.log({ resetPasswordToken })
  const user = await userModel.findOne({
    resetPasswordToken,
    resetPasswordExpire: { $gt: Date.now() },
  });
  if (!user) {
    return next(new ErrorHandler("Reset password token is invalid or has been expired.", 400));
  }

  if (password !== confirmPassword) {
    return next(new ErrorHandler("Please confirm your password", 400));
  }
  user.password = password;
  user.resetPasswordExpire = undefined;
  user.resetPasswordToken = undefined;
  await user.save({ validateBeforeSave: false });

  // const token = await user.getJWTToken();
  res.status(200).json({ message: "Password Successfully Reset." });
});