const shippingModel = require('../models/shippingModel');
const APIFeatures = require("../utils/apiFeatures");
const catchAsyncError = require("../utils/catchAsyncError");
const ErrorHandler = require("../utils/errorHandler");

const getDesc = (label, charge) => {
  const type = {
    "Local": `If your city/town is located in Ontario and is one of the following: "Mississauga", "Oakville", "Milton", "Brampton", or "Etobicoke", then there will be no shipping charge and order will be delivered by tomorrow.\nNote:- Order will be delivered on same day on placing order before 12PM.`,
    "Provincial": `If the town is located in Ontario but is not one of the above five towns, then the delivery will take 3-4 business days. There will be a $${charge} shipping charge for order amounts less than $200, and no shipping charge for order amounts equal to or greater than $200.`,
    "National": `For all other towns not mentioned in the above two scenarios, the delivery will take 3-4 business days. There will be a $${charge} shipping charge for order amounts less than $300, and no shipping charge for order amounts equal to or greater than $300.`
  }

  return type[label];
};

exports.createShipping = catchAsyncError(async (req, res, next) => {
  console.log("create shipping", req.body);
  // const { label, charge } = req.body;
  // const description = getDesc(label, charge);
  // const shipping = await shippingModel.create({ label, description, charge });
  const shipping = await shippingModel.create(req.body);
  res.status(201).json({ shipping });
});

exports.getAllShipping = catchAsyncError(async (req, res, next) => {
  console.log("get all shipping");
  const shippings = await shippingModel.find();
  res.status(200).json({ shippings });
});

exports.getShipping = catchAsyncError(async (req, res, next) => {
  const { id } = req.params;
  const shipping = await shippingModel.findById(id);
  if (!shipping) return next(new ErrorHandler('Shipping not found', 404));
  res.status(200).json({ shipping });
});

exports.updateShipping = catchAsyncError(async (req, res, next) => {
  const { id } = req.params;
  // const { label, charge } = req.body;
  // const description = getDesc(label, charge);

  // const shipping = await shippingModel.findByIdAndUpdate(id, { label, description, charge }, {
  const shipping = await shippingModel.findByIdAndUpdate(id, req.body, {
    new: true,
    runValidators: true,
    useFindAndModify: false,
  });

  if (!shipping) return next(new ErrorHandler('Shipping not found', 404));

  res.status(200).json({ shipping });
});

exports.deleteShipping = catchAsyncError(async (req, res, next) => {
  const { id } = req.params;
  let shipping = await shippingModel.findById(id);

  if (!shipping) return next(new ErrorHandler("Shipping not found", 404));

  await shipping.remove();

  res.status(200).json({
    success: true,
    message: "Shipping Deleted successfully.",
  });
});
