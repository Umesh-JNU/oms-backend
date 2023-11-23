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
  const apiFeature = new APIFeatures(
    faqModel.find().sort({ createdAt: -1 }),
    req.query
  ).search("question");

  let faqs = await apiFeature.query;
  console.log("faqs", { faqs });
  let filteredFAQCount = faqs.length;
  if (req.query.resultPerPage && req.query.currentPage) {
    apiFeature.pagination();

    console.log("filteredFAQCount", filteredFAQCount);
    faqs = await apiFeature.query.clone();
  }

  console.log("faqs", faqs);
  res.status(200).json({ faqs, filteredFAQCount });
});

exports.getFaq = catchAsyncError(async (req, res, next) => {
  const { id } = req.params;
  console.log("faq id", { id })
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
