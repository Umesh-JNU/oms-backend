const quantityModel = require("../models/quantityModel");
const catchAsyncError = require("../utils/catchAsyncError");
const ErrorHandler = require("../utils/errorHandler");
const APIFeatures = require("../utils/apiFeatures");

exports.createQuantity = catchAsyncError(async (req, res, next) => {
  const { qname } = req.body;
  const quantity = await quantityModel.create({ qname });
  res.status(200).json({ quantity });
});

exports.getQuantity = catchAsyncError(async (req, res, next) => {
  const { id } = req.params;
  const quantity = await quantityModel.findById(id);
  if (!quantity) return next(new ErrorHandler("Quantity not found", 404));
  res.status(200).json({ quantity });
});

exports.updateQuantity = catchAsyncError(async (req, res, next) => {
  const { id } = req.params;
  const { qname } = req.body;
  const quantity = await quantityModel.findByIdAndUpdate(
    id,
    { qname },
    {
      new: true,
      runValidators: true,
      useFindAndModify: false,
    }
  );
  res.status(200).json({ quantity });
});

exports.deleteQuantity = catchAsyncError(async (req, res, next) => {
  const { id } = req.params;
  let quantity = await quantityModel.findById(id);

  if (!quantity) {
    return next(new ErrorHandler("Quantity not found", 404));
  }

  await quantity.remove();

  res.status(200).json({
    success: true,
    message: "Quantity Deleted successfully.",
  });
});

exports.getAllQuantities = catchAsyncError(async (req, res, next) => {
  const quantityCount = await quantityModel.countDocuments();
  console.log("quantityCount", quantityCount);
  const apiFeature = new APIFeatures(
    quantityModel.find().sort({ createdAt: -1 }),
    req.query
  ).search("qname");

  let quantities = await apiFeature.query;
  console.log("quantities", quantities);
  let filteredQuantityCount = quantities.length;
  if (req.query.resultPerPage && req.query.currentPage) {
    apiFeature.pagination();

    console.log("filteredQuantityCount", filteredQuantityCount);
    quantities = await apiFeature.query.clone();
    console.log("quantities1", quantities);
  }
  res.status(200).json({ quantities, quantityCount, filteredQuantityCount });
});
