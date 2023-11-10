const { faqModel, aggregate } = require('../models/faqModel');
const APIFeatures = require("../utils/apiFeatures");
const catchAsyncError = require("../utils/catchAsyncError");
const ErrorHandler = require("../utils/errorHandler");

exports.createFaq = catchAsyncError(async (req, res, next) => {
  console.log("create faq", req.body);
  const faq = await faqModel.create(req.body);
  res.status(201).json({ faq });
});

exports.getAllFaq = catchAsyncError(async (req, res, next) => {
  console.log("get all faq", req.query);
  const { keyword, currentPage, resultPerPage } = req.query;

  let match = {};
  if (keyword) {
    match = { type: keyword };
  }

  const queryOptions = [];
  if (currentPage && resultPerPage) {
    const r = parseInt(resultPerPage);
    const c = parseInt(currentPage);

    const skip = r * (c - 1);
    queryOptions.push({ $skip: skip });
    queryOptions.push({ $limit: r });
  }

  let faqs = await aggregate(queryOptions, match);
  if (faqs.length === 0) faqs = {};
  else faqs = faqs[0].faqs;

  let filteredFaqCount = faqs.length;
  res.status(200).json({ faqs, filteredFaqCount });
});

exports.getFaq = catchAsyncError(async (req, res, next) => {
  const { id } = req.params;
  const faq = await faqModel.findById(id);
  if (!faq) return next(new ErrorHandler('FAQ not found', 404));
  res.status(200).json({ faq });
});

exports.updateFaq = catchAsyncError(async (req, res, next) => {
  const { id } = req.params;
  const faq = await faqModel.findByIdAndUpdate(id, req.body, {
    new: true,
    runValidators: true,
    useFindAndModify: false,
  });

  if (!faq) return next(new ErrorHandler('FAQ not found', 404));

  res.status(200).json({ faq });
});

exports.deleteFaq = catchAsyncError(async (req, res, next) => {
  const { id } = req.params;
  let faq = await faqModel.findById(id);

  if (!faq) return next(new ErrorHandler("FAQ not found", 404));

  await faq.remove();

  res.status(200).json({
    success: true,
    message: "FAQ Deleted successfully.",
  });
});
