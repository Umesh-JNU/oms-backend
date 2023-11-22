const catchAsyncError = require("../utils/catchAsyncError");
const addrModel = require("../models/addressModel");
const ErrorHandler = require("../utils/errorHandler");
const addressModel = require("../models/addressModel");
const cartModel = require("../models/cartModel");
const { calc_total } = require("./cartController");
const userModel = require("../models/userModel");


const calc_shipping = (total, addr, next) => {
  {/*
   1. if town belongs to Ontario and is one of [ "Mississauga", "Oakville", "Milton", "Brampton", "Etobicoke" ]
   - Same day delivery, 0 shipping charge
   2. town belongs to Ontario but is other than one of the above five towns
   - 3-4 business day for delivery, 20$ shipping charge for order amount < 200$, otherwise 0
   3. other than above two
   - 3-4 business day for delivery, 40$ shipping charge for order amount < 300$, otherwise 0.
  */}

  console.log({ total, addr });

  const towns = ["mississauga", "oakville", "milton", "brampton", "etobicoke"];
  let charge = 0, message = "It will take 2-3 business days for order to be delivered."
  const isProvince = addr.province.toLowerCase() === 'ontario';
  const isTown = towns.includes(addr.town.toLowerCase());
  console.log({ isProvince, isTown });
  console.log(isProvince && isTown);

  switch (true) {
    case isProvince && isTown:
      console.log("CASE 1")
      if (total < 80)
        return next(new ErrorHandler("Please add more items. Minimum order amount is 80$", 400));

      message = "Order will be delivered by tomorrow. Note:- Order will be delivered on same day on placing order before 12PM.";
      break;

    case isProvince && !isTown:
      console.log("CASE 2")
      if (total < 60)
        return next(new ErrorHandler("Please add more items. Minimum order amount is 60$", 400));

      if (total < 200) charge = 20;
      break;

    default:
      console.log("CASE 3")
      if (total < 60)
        return next(new ErrorHandler("Please add more items. Minimum order amount is 60$", 400));

      if (total < 300)
        charge = 40;
      break;
  }

  return [charge, message];
}

const addAddr = catchAsyncError(async (req, res, next) => {
  console.log("add address", req.body, req.userId);
  const userId = req.userId;
  const { province, town, street, post_code, unit, defaultAddress } = req.body;

  if (defaultAddress) {
    await addrModel.updateMany(
      { user: { $eq: userId } },
      {
        $set: { defaultAddress: false },
      }
    );
  }

  const newAddr = {
    province,
    town,
    street,
    post_code,
    unit,
    defaultAddress,
    user: userId,
  };
  console.log(newAddr);

  const address = await addrModel.create(newAddr);
  console.log("addr", address);

  res.status(201).json({ address, defaultAddress: defaultAddress });
});

const getAllAddr = catchAsyncError(async (req, res, next) => {
  const userId = req.userId;

  const address_book = await addrModel.find({ user: userId });

  res.status(200).json({ address_book });
});

const deleteAddr = catchAsyncError(async (req, res, next) => {
  const { id } = req.params;
  const userId = req.userId;

  const address = await addrModel.findOne({ _id: id, user: userId });
  console.log("addr", address);

  if (!address) return next(new ErrorHandler("Address not found.", 404));

  await address.remove();

  res.status(202).json({ message: "Address Deleted successfully." });
});

const updateAddr = catchAsyncError(async (req, res, next) => {
  const { id } = req.params;
  const userId = req.userId;
  const { province, town, street, post_code, unit, defaultAddress } = req.body;

  const address = await addrModel.findOne({ _id: id, user: userId });
  if (!address) return next(new ErrorHandler("Address not found.", 404));

  if (defaultAddress) {
    console.log("true");
    // const tempaddr = await addrModel.find(
    //   { user: { $eq: userId } },
    //   { defaultAddress: true }
    // );
    await addrModel.updateMany(
      { _id: { $ne: id } },
      {
        $set: { defaultAddress: false },
      }
    );
    // console.log("tempaddr ", tempaddr);
  }

  address.province = province;
  address.street = street;
  address.town = town;
  address.post_code = post_code;
  address.unit = unit;
  address.defaultAddress = defaultAddress;

  await address.save();

  console.log("addr", address);

  res.status(203).json({ address });
});

const getAddr = catchAsyncError(async (req, res, next) => {
  const { id } = req.params;
  console.log(req.userId);
  const userId = req.userId;

  console.log("user", userId);
  const address = await addrModel.findOne({ _id: id, user: userId });
  console.log("addr", address);

  if (!address) return next(new ErrorHandler("Address not found.", 404));

  res.status(200).json({ address });
});

const getShippingCharge = catchAsyncError(async (req, res, next) => {
  const { addr_id } = req.query;

  const addr = await addressModel.findById(addr_id);
  if (!addr)
    return next(new ErrorHandler("Address not found", 404));

  const cart = await (await cartModel
    .findOne({ user: req.userId })
    .populate("items.product")).populate("items.product.pid", "-subProduct");

  if (!cart)
    return next(new ErrorHandler("Cart not found", 404));

  const [total, inSalePrice] = calc_total(cart);
  // const [charge, message] = calc_shipping(total, addr, next);

  console.log({ total })
  const user = await userModel.findById(req.userId);
  res.status(200).json({
    total,
    charge: 0,
    free_ship: user.free_ship,
    // message
  })
});

module.exports = {
  addAddr,
  getAddr,
  updateAddr,
  deleteAddr,
  getAllAddr,
  getShippingCharge,
  calc_shipping
};