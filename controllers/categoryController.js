const mongoose = require("mongoose");
const {
  categoryModel,
  subCategoryModel,
  aggregate,
} = require("../models/productModel");
const APIFeatures = require("../utils/apiFeatures");
const catchAsyncError = require("../utils/catchAsyncError");
const ErrorHandler = require("../utils/errorHandler");

exports.createCategory = catchAsyncError(async (req, res, next) => {
  console.log("create category", req.body);
  const category = await categoryModel.create(req.body);
  res.status(200).json({ category });
});

exports.getAllCategories = catchAsyncError(async (req, res, next) => {
  console.log(req.query)
  const categoryCount = await categoryModel.countDocuments();
  console.log("categoryCount", categoryCount);
  const apiFeature = new APIFeatures(
    categoryModel.find().sort({ createdAt: -1 }),
    req.query
  ).search("name");

  let categories = await apiFeature.query;
  console.log("categories", categories);
  let filteredCategoryCount = categories.length;
  if (req.query.resultPerPage && req.query.currentPage) {
    apiFeature.pagination();

    console.log("filteredCategoryCount", filteredCategoryCount);
    categories = await apiFeature.query.clone();
    console.log("categories1", categories);
  }
  console.log({ categories, categoryCount, filteredCategoryCount })
  res.status(200).json({ categories, categoryCount, filteredCategoryCount });
});

exports.getCategory = catchAsyncError(async (req, res, next) => {
  console.log("get caategory")
  const { id } = req.params;
  const category = await categoryModel.findById(id);
  if (!category) return next(new ErrorHandler("Category not found", 404));
  res.status(200).json({ category });
});

exports.updateCategory = catchAsyncError(async (req, res, next) => {
  const { id } = req.params;
  const category = await categoryModel.findByIdAndUpdate(id, req.body, {
    new: true,
    runValidators: true,
    useFindAndModify: false,
  });
  res.status(200).json({ category });
});

exports.deleteCategory = catchAsyncError(async (req, res, next) => {
  const { id } = req.params;
  let category = await categoryModel.findById(id);

  if (!category) return next(new ErrorHandler("Category not found", 404));

  await category.remove();

  res.status(200).json({
    success: true,
    message: "Category Deleted successfully.",
  });
});

exports.getAllProducts = catchAsyncError(async (req, res, next) => {
  const { name } = req.params;
  console.log({ name })

  var categoryQry;
  if (name !== 'null') {
    const category = await categoryModel.findOne({ name })
    var categoryQry = { category: mongoose.Types.ObjectId(category._id) };
  }
  const products = await aggregate([], categoryQry);
  // if (id === "64407ccb7d5153dc445477d8") products = await aggregate([], { sale: { $gt: 0 } });
  // else products = await aggregate([], { category: mongoose.Types.ObjectId(category._id) });

  res.status(200).json({ products });
});

