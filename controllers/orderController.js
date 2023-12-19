const fs = require('fs');
const path = require('path');
const { default: mongoose } = require("mongoose");

const Order = require("../models/orderModel");
const cartModel = require("../models/cartModel");
const { v4: uuid } = require("uuid");
const sendEmail = require("../utils/sendEmail");
const catchAsyncError = require("../utils/catchAsyncError");
const APIFeatures = require("../utils/apiFeatures");
const ErrorHandler = require("../utils/errorHandler");
const addressModel = require("../models/addressModel");
const userModel = require("../models/userModel");
const { productModel, subProdModel, categoryModel } = require("../models/productModel");

exports.createOrder = catchAsyncError(async (req, res, next) => {
  const userId = req.userId;

  const user = await userModel.findById(userId).select("+firstname +lastname +dist_name +dist_email");
  if (!user) {
    return next(new ErrorHandler("User Not Found.", 404));
  }

  const cart = await cartModel
    .findOne({ user: userId })
    .populate({
      path: "items.product",
      populate: { path: "pid", select: "-subProduct" }
    });

  if (cart?.items.length <= 0)
    return next(new ErrorHandler("Order can't placed. Add product to cart.", 401));

  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    let items = '';
    const products = [];
    for (let i = 0; i < cart.items.length; i++) {
      const item = cart.items[i];
      console.log("CART ITEM", item);

      const { product, quantity } = item;
      if (!product.stock) {
        return next(new ErrorHandler("Some of items in your cart is out of stock.", 400));
      }

      const prod = await subProdModel.findById(product._id);
      if (!prod) {
        return next(new ErrorHandler("Something went wrong.", 400));
      }

      const category = await categoryModel.findById(product.pid.category);
      const variant = `${product.quantity} ${category.location === 'US' ? 'fl. Oz.' : "ml"}`;
      items += `
      <div class="item">
        <p><strong>${i + 1}. ${product?.pid?.name}</strong>, ${variant} X ${quantity}</p>
      </div>`;

      products.push({
        quantity,
        product: product._doc,
        parent_prod: product.pid._doc,
        variant
      });
    }

    const { addr_id, mobile_no } = req.body;

    const addr = await addressModel.findById(addr_id);
    if (!addr) return next(new ErrorHandler("Address not found", 404));

    const { province, town, street, post_code } = addr;
    const unique_id = uuid();
    const orderId = unique_id.slice(0, 6);

    console.log("orderId ", orderId);
    console.log('order create', req.body);

    const savedOrder = (await Order.create([{
      userId: userId,
      products: products,
      address: {
        province,
        post_code,
        street,
        town,
        mobile_no
      },
      orderId: '#' + orderId,
    }], { session }))[0];

    await cartModel.updateOne({ user: req.userId }, { $set: { items: [] } }, { session });

    // ---------------- SEND ORDER SUMMARY EMAIL ------------------
    const orderDetails = {
      username: user.firstname + ' ' + user.lastname,
      orderId: '#' + orderId,
      createdAt: new Date().toISOString().slice(0, 10),
      address: `${street}, ${town}, ${province}, ${post_code}`,
      items,
      dist_name: user.dist_name,
      dist_email: user.dist_email
    };
    const template = fs.readFileSync(path.join(__dirname + "/templates", "order.html"), "utf-8");

    // /{{(\w+)}}/g - match {{Word}} globally
    const renderedTemplate = template.replace(/{{(\w+)}}/g, (match, key) => {
      console.log({ match, key })
      return orderDetails[key] || match;
    });

    await sendEmail({
      email: user.email,
      subject: 'Order Summary',
      message: renderedTemplate
    });
    // --------------------------------------------------------
    await session.commitTransaction();
    res.status(200).json({ message: "Order created!", savedOrder });

  } catch (error) {
    await session.abortTransaction();
    next(new ErrorHandler(error.message, 400));
  } finally {
    session.endSession();
  }
});

exports.getAll = catchAsyncError(async (req, res, next) => {
  let query = { userId: req.userId };
  if (req.query.status !== "all") query.status = req.query.status;

  const apiFeature = new APIFeatures(Order.find(query).sort({ createdAt: -1 }), req.query);

  const orders = await apiFeature.query;

  res.status(200).json({ orders });
});

// for admin
exports.getAllOrders = catchAsyncError(async (req, res, next) => {
  console.log("req.query", req.query);
  let query = {};
  if (req.query.orderId) {
    query = {
      orderId: {
        $regex: req.query.orderId,
        $options: "i",
      },
    };
  }

  console.log("query", query);
  const apiFeature = new APIFeatures(
    Order.find(query).sort({ createdAt: -1 }).populate("userId"),
    req.query
  );

  let orders = await apiFeature.query;
  // console.log("orders", orders);
  let filteredOrderCount = orders.length;

  apiFeature.pagination();
  orders = await apiFeature.query.clone();

  res.status(200).json({ orders, filteredOrderCount });
});

exports.getOrderById = catchAsyncError(async (req, res, next) => {
  const { id } = req.params;
  console.log("get order", id);
  const order = await Order.findById(id).sort({ createdAt: -1 }).populate("userId", "firstname lastname dist_name dist_email");

  if (!order) return next(new ErrorHandler("Order not found.", 404));

  res.status(200).json({ order });
});

exports.getOrder = catchAsyncError(async (req, res, next) => {
  const orders = await Order.findOne({ userId: req.userId })
    .sort({ _id: -1 }).limit(1);

  res.status(200).json({ message: "Order found!", orders });
});

exports.getRecent = catchAsyncError(async (req, res, next) => {
  const orders = await Order.find({ userId: req.userId })
    .sort({ _id: -1 }).limit(4);;

  res.status(200).json({ message: "Order found!", orders });
});


exports.updateOrderStatus = catchAsyncError(async (req, res, next) => {
  const { id } = req.params;
  const { status } = req.body;
  const order = await Order.findById(id);

  if (!order) return next(new ErrorHandler("Order not found.", 404));

  order.status = status;
  await order.save();
  res.status(200).json({ order });
});

exports.deleteOrder = catchAsyncError(async (req, res, next) => {
  const { id } = req.params;
  let order = await Order.findById(id);
  console.log("delete order", order);
  if (!order) {
    return res.status(404).json({ message: "Order Not Found" });
  }

  await order.remove();

  res.status(200).json({
    success: true,
    message: "Order Deleted successfully.",
  });
});