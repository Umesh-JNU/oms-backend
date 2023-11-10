const catchAsyncError = require("../utils/catchAsyncError");
const reviewModel = require("../models/reviewModel");
const userModel = require("../models/userModel");
const {productModel} = require("../models/productModel");
const ErrorHandler = require("../utils/errorHandler");
const APIFeatures = require("../utils/apiFeatures");

exports.addReview = catchAsyncError(async (req, res, next) => {
  console.log("add review", req.body, req.userId);
  const userId = req.userId;
  const { product, comment, rating } = req.body;

  if (rating <= 0)
    return next(
      new ErrorHandler("Rating value should be more than zero.", 401)
    );

  const prod = await productModel.findById(product);
  if (!prod) return next(new ErrorHandler("Product not found", 404));

  const user = await userModel.findById(userId);
  if (!user) return next(new ErrorHandler("User not found", 404));

  const num = await reviewModel.count({product});
  const r = (prod.rating + rating) / (num + 1);
  prod.rating = r.toFixed(1);
  await prod.save();

  const review = await reviewModel.create({
    rating,
    product,
    comment,
    user,
  });

  console.log("review", review);

  res.status(201).json({ review });
});

exports.getAllReview = catchAsyncError(async (req, res, next) => {
  const { product } = req.params;

  const reviews = await reviewModel.find({ product }).sort({createdAt: -1}).populate('user');

  res.status(200).json({ reviews });
});

exports.deleteReview = catchAsyncError(async (req, res, next) => {
  const {id} = req.params;
  const review = await reviewModel.findById(id);
  if(!review) return next(new ErrorHandler("Review not found.", 404));

  await review.remove();
  res.status(200).json({message: "Review Deleted successfully.",})
})
exports.getReview = catchAsyncError(async (req, res, next) => {
  const { product } = req.params;
  console.log("product", product);
  const userId = req.userId;
  console.log("user", userId);

  const user = await userModel.findById(userId);
  if (!user) return next(new ErrorHandler("User not found", 404));

  const review = await reviewModel.findOne({
    product,
    user: userId,
  });
  console.log("review", review);

  if (!review) return next(new ErrorHandler("Review not found.", 404));

  res.status(200).json({ review });
});

exports.allReviews = catchAsyncError(async (req, res, next) => {
  console.log("req.query", req.query);
  const reviewCount = await reviewModel.countDocuments();
  console.log("reviewCount", reviewCount);
  const apiFeature = new APIFeatures(
    reviewModel.find().sort({createAt: -1}).populate("product").populate('user'),
    req.query
  ).search('comment');

  let reviews = await apiFeature.query;
  console.log("reviews", reviews);
  let filteredReviewCount = reviews.length;

  if (req.query.resultPerPage && req.query.currentPage) {
    apiFeature.pagination();

    console.log("filteredReviewCount", filteredReviewCount);
    reviews = await apiFeature.query.clone();
  }

  console.log("reviews1", reviews);
  res.status(200).json({ reviews, reviewCount, filteredReviewCount });
});
