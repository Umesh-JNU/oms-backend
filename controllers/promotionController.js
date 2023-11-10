const promotionModel = require("../models/promotionModel");
const catchAsyncError = require("../utils/catchAsyncError");
const ErrorHandler = require("../utils/errorHandler");

exports.createPromotion = catchAsyncError(async (req, res, next) => {
  console.log("add promotion", req.body);
  const { promo_image } = req.body;
  const promotionCount = await promotionModel.countDocuments();

  if (promotionCount >= 3) {
    const oldestPromotion = await promotionModel.find().sort({ "date_time": 1 }).limit(1);
    console.log('oldestPromotion', oldestPromotion);
    await oldestPromotion[0].remove();
  }

  const promotion = await promotionModel.create({ promo_image });

  res.status(200).json({ promotion });
});

exports.getAllPromotion = catchAsyncError(async (req, res, next) => {
  const promotions = await promotionModel.find().sort({ createdAt: -1 });
  res.status(200).json({ promotions });
});

exports.getPromotion = catchAsyncError(async (req, res, next) => {
  const { id } = req.params;
  const promotion = await promotionModel.findById(id);
  if (!promotion) return next(new ErrorHandler("Promotion not found", 404));

  res.status(200).json({ promotion });
});

exports.updatePromotion = catchAsyncError(async (req, res, next) => {
  const { id } = req.params;
  const { promo_image } = req.body;
  const promotion = await promotionModel.findByIdAndUpdate(
    id,
    { promo_image },
    {
      new: true,
      runValidators: true,
      useFindAndModify: false,
    }
  );
  res.status(200).json({ promotion });
});

exports.deletePromotion = catchAsyncError(async (req, res, next) => {
  const { id } = req.params;
  let promotion = await promotionModel.findById(id);

  if (!promotion) {
    return next(new ErrorHandler("Promotion Not Found", 404));
  }

  await promotion.remove();

  res.status(200).json({
    message: "Category Deleted successfully.",
  });
});
