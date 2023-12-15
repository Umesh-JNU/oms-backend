const bannerModel = require("../models/bannerModel");
const catchAsyncError = require("../utils/catchAsyncError");
const ErrorHandler = require("../utils/errorHandler");
const { s3Delete } = require("../utils/s3");

exports.createBanner = catchAsyncError(async (req, res, next) => {
  console.log("add banner", req.body);
  const banner = await bannerModel.create(req.body);
  res.status(201).json({ banner });

  // if (bannerCount >= 3) {
  //   const oldestbanner = await bannerModel.find().sort({ "date_time": 1 }).limit(1);
  //   console.log('oldestbanner', oldestbanner);
  //   await oldestbanner[0].remove();
  // }
});

exports.getAllBanner = catchAsyncError(async (req, res, next) => {
  const banners = await bannerModel.find().sort({ createdAt: -1 });
  res.status(200).json({ banners });
});

exports.deleteBanner = catchAsyncError(async (req, res, next) => {
  const { id } = req.params;

  const banner = await bannerModel.findById(id);
  if (!banner) {
    return next(new ErrorHandler("banner Not Found", 404));
  }

  await banner.remove();
  // const results = await s3Delete(banner.img_url);

  // res.status(200).json({ message: "Banner Deleted successfully.", results });
  res.status(200).json({ message: "Banner Deleted successfully." });
});
