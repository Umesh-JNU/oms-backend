const orderModel = require("../models/orderModel");
const {
  categoryModel,
  subCategoryModel,
  productModel,
} = require("../models/productModel");
const quantityModel = require("../models/quantityModel");
const userModel = require("../models/userModel");
const catchAsyncError = require("../utils/catchAsyncError");
const ErrorHandler = require("../utils/errorHandler");
const { s3Uploadv2, s3UploadMulti } = require("../utils/s3");

exports.postSingleImage = catchAsyncError(async (req, res, next) => {
  const file = req.file;
  if (!file) return next(new ErrorHandler("Invalid Image", 401));

  const results = await s3Uploadv2(file);
  const location = results.Location && results.Location;
  return res.status(201).json({ data: { location } });
});

exports.postMultipleImages = catchAsyncError(async (req, res, next) => {
  const files = req.files;
  if (files) {
    const results = await s3UploadMulti(files);
    console.log(results);
    let location = [];
    results.filter((result) => {
      location.push(result.Location);
    });
    return res.status(201).json({ data: { location } });
  } else {
    return next(new ErrorHandler("Invalid Image", 401));
  }
});

exports.getAll = catchAsyncError(async (req, res, next) => {
  const { product, quantity } = req.query;
  const categories = await categoryModel.find();
  const subCategories = await subCategoryModel.find();
  let products, quantities;
  if (product) products = await productModel.find();
  if (quantity) quantities = await quantityModel.find();
  res.status(200).json({ categories, subCategories, products, quantities });
});

exports.getStatistics = catchAsyncError(async (req, res, next) => {
  const { time } = req.params;
  const date = new Date();
  date.setHours(24, 0, 0, 0);
  const month = date.getMonth() + 1;
  const year = date.getFullYear();
  let startDate = new Date(date.getFullYear(), 0, 1);
  var days = Math.floor((date - startDate) / (24 * 60 * 60 * 1000));
  var week = Math.ceil(days / 7);

  if (time == "all") {
    const users = await userModel.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
        },
      },
    ]);
    const orders = await orderModel.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
        },
      },
    ]);
    const payments = await orderModel.aggregate([
      {
        $project: {
          amount: 1,
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: "$amount" },
        },
      },
    ]);
    const quantity = await orderModel.aggregate([
      {
        $project: {
          quantity: { $sum: "$products.quantity" },
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: "$quantity" },
        },
      },
    ]);
    const dailyUsers = await userModel.aggregate([
      {
        $project: {
          month: { $month: "$createdAt" },

          year: { $year: "$createdAt" },
        },
      },
      {
        $match: {
          year: year,
        },
      },
      {
        $group: {
          _id: "$month",
          total: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);
    const dailyOrders = await orderModel.aggregate([
      {
        $project: {
          month: { $month: "$createdAt" },

          year: { $year: "$createdAt" },
        },
      },
      {
        $match: {
          year: year,
        },
      },
      {
        $group: {
          _id: "$month",
          total: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);
    const dailyQuantity = await orderModel.aggregate([
      {
        $project: {
          month: { $month: "$createdAt" },

          year: { $year: "$createdAt" },
          quantity: { $sum: "$products.quantity" },
        },
      },
      {
        $match: {
          year: year,
        },
      },
      {
        $group: {
          _id: "$month",
          total: { $sum: "$quantity" },
        },
      },
      { $sort: { _id: 1 } },
    ]);
    const dailyPayments = await orderModel.aggregate([
      {
        $project: {
          month: { $month: "$createdAt" },

          year: { $year: "$createdAt" },
          amount: 1,
        },
      },
      {
        $match: {
          year: year,
        },
      },
      {
        $group: {
          _id: "$month",
          total: { $sum: "$amount" },
        },
      },
      { $sort: { _id: 1 } },
    ]);
    return res.send({
      users: users,
      payments: payments,
      orders: orders,
      quantity: quantity,
      dailyUsers,
      dailyOrders,
      dailyQuantity,
      dailyPayments,
    });
  }
  if (time == "daily") {
    const users = await userModel.aggregate([
      {
        $match: {
          $expr: {
            $gt: [
              "$createdAt",
              { $dateSubtract: { startDate: date, unit: "day", amount: 1 } },
            ],
          },
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
        },
      },
    ]);
    const orders = await orderModel.aggregate([
      {
        $match: {
          $expr: {
            $gt: [
              "$createdAt",
              { $dateSubtract: { startDate: date, unit: "day", amount: 1 } },
            ],
          },
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
        },
      },
    ]);
    const payments = await orderModel.aggregate([
      {
        $match: {
          $expr: {
            $gt: [
              "$createdAt",
              { $dateSubtract: { startDate: date, unit: "day", amount: 1 } },
            ],
          },
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: "$amount" },
        },
      },
    ]);
    const quantity = await orderModel.aggregate([
      {
        $match: {
          $expr: {
            $gt: [
              "$createdAt",
              { $dateSubtract: { startDate: date, unit: "day", amount: 1 } },
            ],
          },
        },
      },
      {
        $addFields: {
          quantity: { $sum: "$products.quantity" },
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: "$quantity" },
        },
      },
    ]);
    const dailyUsers = await userModel.aggregate([
      {
        $match: {
          $expr: {
            $gt: [
              "$createdAt",
              { $dateSubtract: { startDate: date, unit: "day", amount: 6 } },
            ],
          },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          total: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);
    const dailyOrders = await orderModel.aggregate([
      {
        $match: {
          $expr: {
            $gt: [
              "$createdAt",
              { $dateSubtract: { startDate: date, unit: "day", amount: 6 } },
            ],
          },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          total: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);
    const dailyPayments = await orderModel.aggregate([
      {
        $match: {
          $expr: {
            $gt: [
              "$createdAt",
              { $dateSubtract: { startDate: date, unit: "day", amount: 6 } },
            ],
          },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          total: { $sum: "$amount" },
        },
      },
      { $sort: { _id: 1 } },
    ]);
    const dailyQuantity = await orderModel.aggregate([
      {
        $match: {
          $expr: {
            $gt: [
              "$createdAt",
              { $dateSubtract: { startDate: date, unit: "day", amount: 6 } },
            ],
          },
        },
      },
      {
        $addFields: {
          quantity: { $sum: "$products.quantity" },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          total: { $sum: "$quantity" },
        },
      },
      { $sort: { _id: 1 } },
    ]);
    return res.send({
      users: users,
      payments: payments,
      orders: orders,
      quantity: quantity,
      dailyUsers,
      dailyOrders,
      dailyPayments,
      dailyQuantity,
    });
  }
  if (time == "weekly") {
    const users = await userModel.aggregate([
      {
        $project: {
          week: { $week: "$createdAt" },

          year: { $year: "$createdAt" },
        },
      },
      {
        $match: {
          year: year,
          week: week,
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
        },
      },
    ]);
    const payments = await orderModel.aggregate([
      {
        $project: {
          week: { $week: "$createdAt" },

          year: { $year: "$createdAt" },
          amount: 1,
        },
      },
      {
        $match: {
          year: year,
          week: week,
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: "$amount" },
        },
      },
    ]);
    const orders = await orderModel.aggregate([
      {
        $project: {
          week: { $week: "$createdAt" },

          year: { $year: "$createdAt" },
        },
      },
      {
        $match: {
          year: year,
          week: week,
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
        },
      },
    ]);
    const quantity = await orderModel.aggregate([
      {
        $project: {
          week: { $week: "$createdAt" },

          year: { $year: "$createdAt" },
          quantity: { $sum: "$products.quantity" },
        },
      },
      {
        $match: {
          year: year,
          week: week,
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: "$quantity" },
        },
      },
    ]);
    const dailyUsers = await userModel.aggregate([
      {
        $project: {
          week: { $week: "$createdAt" },

          year: { $year: "$createdAt" },
        },
      },
      {
        $match: {
          year: year,
        },
      },
      {
        $group: {
          _id: "$week",
          total: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);
    const dailyOrders = await orderModel.aggregate([
      {
        $project: {
          week: { $week: "$createdAt" },

          year: { $year: "$createdAt" },
        },
      },
      {
        $match: {
          year: year,
        },
      },
      {
        $group: {
          _id: "$week",
          total: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);
    const dailyQuantity = await orderModel.aggregate([
      {
        $project: {
          week: { $week: "$createdAt" },

          year: { $year: "$createdAt" },
          quantity: { $sum: "$products.quantity" },
        },
      },
      {
        $match: {
          year: year,
        },
      },
      {
        $group: {
          _id: "$week",
          total: { $sum: "quantity" },
        },
      },
      { $sort: { _id: 1 } },
    ]);
    const dailyPayments = await orderModel.aggregate([
      {
        $project: {
          week: { $week: "$createdAt" },

          year: { $year: "$createdAt" },
          amount: 1,
        },
      },
      {
        $match: {
          year: year,
        },
      },
      {
        $group: {
          _id: "$week",
          total: { $sum: "$amount" },
        },
      },
      { $sort: { _id: 1 } },
    ]);
    return res.send({
      users: users,
      payments: payments,
      orders: orders,
      quantity: quantity,
      dailyUsers,
      dailyOrders,
      dailyQuantity,
      dailyPayments,
    });
  }
  if (time == "monthly") {
    const users = await userModel.aggregate([
      {
        $project: {
          month: { $month: "$createdAt" },

          year: { $year: "$createdAt" },
        },
      },
      {
        $match: {
          year: year,
          month: month,
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
        },
      },
    ]);
    const orders = await orderModel.aggregate([
      {
        $project: {
          month: { $month: "$createdAt" },

          year: { $year: "$createdAt" },
        },
      },
      {
        $match: {
          year: year,
          month: month,
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
        },
      },
    ]);
    const payments = await orderModel.aggregate([
      {
        $project: {
          month: { $month: "$createdAt" },

          year: { $year: "$createdAt" },
          amount: 1,
        },
      },
      {
        $match: {
          year: year,
          month: month,
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: "$amount" },
        },
      },
    ]);
    const quantity = await orderModel.aggregate([
      {
        $project: {
          month: { $month: "$createdAt" },

          year: { $year: "$createdAt" },
          quantity: { $sum: "$products.quantity" },
        },
      },
      {
        $match: {
          year: year,
          month: month,
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: "$quantity" },
        },
      },
    ]);
    const dailyUsers = await userModel.aggregate([
      {
        $project: {
          month: { $month: "$createdAt" },

          year: { $year: "$createdAt" },
        },
      },
      {
        $match: {
          year: year,
        },
      },
      {
        $group: {
          _id: "$month",
          total: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);
    const dailyOrders = await orderModel.aggregate([
      {
        $project: {
          month: { $month: "$createdAt" },

          year: { $year: "$createdAt" },
        },
      },
      {
        $match: {
          year: year,
        },
      },
      {
        $group: {
          _id: "$month",
          total: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);
    const dailyQuantity = await orderModel.aggregate([
      {
        $project: {
          month: { $month: "$createdAt" },

          year: { $year: "$createdAt" },
          quantity: { $sum: "$products.quantity" },
        },
      },
      {
        $match: {
          year: year,
        },
      },
      {
        $group: {
          _id: "$month",
          total: { $sum: "$quantity" },
        },
      },
      { $sort: { _id: 1 } },
    ]);
    const dailyPayments = await orderModel.aggregate([
      {
        $project: {
          month: { $month: "$createdAt" },

          year: { $year: "$createdAt" },
          amount: 1,
        },
      },
      {
        $match: {
          year: year,
        },
      },
      {
        $group: {
          _id: "$month",
          total: { $sum: "$amount" },
        },
      },
      { $sort: { _id: 1 } },
    ]);
    return res.send({
      users: users,
      payments: payments,
      orders: orders,
      quantity: quantity,
      dailyUsers,
      dailyOrders,
      dailyQuantity,
      dailyPayments,
    });
  }
});
