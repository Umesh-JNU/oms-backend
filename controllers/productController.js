const mongoose = require("mongoose");
const { productModel, subProdModel, aggregate } = require("../models/productModel");
const reviewModel = require("../models/reviewModel");
const saleModel = require("../models/saleModel");
const cartModel = require("../models/cartModel");
const APIFeatures = require("../utils/apiFeatures");
const catchAsyncError = require("../utils/catchAsyncError");
const ErrorHandler = require("../utils/errorHandler");

exports.createProduct = catchAsyncError(async (req, res, next) => {
  console.log(req.body);
  const { variant } = req.body;
  if (!variant || variant.length === 0) {
    return next(new ErrorHandler("Please provide at least one variant.", 400));
  }

  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const product = (await productModel.create([req.body], { session }))[0];

    console.log({ product })
    variant.forEach(v => { v.pid = product._id });
    console.log({ variant })
    const subProducts = await subProdModel.create([...variant], { session });

    await session.commitTransaction();
    res.status(200).json({ product, subProducts });
  } catch (error) {
    await session.abortTransaction();
    next(new ErrorHandler(error.message, 400));
  } finally {
    session.endSession();
  }
});

exports.getAllProducts = catchAsyncError(async (req, res, next) => {
  console.log("req.query", req.query);
  const productCount = await productModel.countDocuments();
  console.log("productCount", productCount);

  // for users
  const { keyword, currentPage, resultPerPage } = req.query;

  let match = {};
  if (keyword) {
    match = { name: { $regex: keyword, $options: "i" } };
  }

  // let products = await aggregate(match);
  // console.log(products.length);
  // console.log({ products });
  // if (currentPage && resultPerPage) {
  //   const r = parseInt(resultPerPage);
  //   const c = parseInt(currentPage);

  //   const skip = r * (c-1);
  //   console.log(skip, skip+r);
  //   products = products.slice(skip, skip + r);
  // }

  const queryOptions = [];
  if (currentPage && resultPerPage) {
    const r = parseInt(resultPerPage);
    const c = parseInt(currentPage);

    const skip = r * (c - 1);
    queryOptions.push({ $skip: skip });
    queryOptions.push({ $limit: r });
  }

  // for admin
  if (req.user && req.user.role === 'admin') {
    var products = await productModel.aggregate([
      { $match: { ...match } },
      {
        $lookup: {
          from: "categories",
          localField: "category",
          foreignField: "_id",
          as: "category"
        }
      },
      { $unwind: { path: "$category", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "subcategories",
          localField: "sub_category",
          foreignField: "_id",
          as: "sub_category"
        }
      },
      { $unwind: { path: "$sub_category", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "subproducts",
          localField: "_id",
          foreignField: "pid",
          as: "subProducts"
        }
      },
      { $sort: { createdAt: -1 } },
      ...queryOptions
    ]);

    // const apiFeature = new APIFeatures(
    //   productModel.find().sort({ createdAt: -1 }).populate("category sub_category"),
    //   req.query
    // ).search("name");

    // var products = await apiFeature.query;
    // console.log("products", products);
    // let filteredProductCount = products.length;
    // if (req.query.resultPerPage && req.query.currentPage) {
    //   apiFeature.pagination();

    //   console.log("filteredProductCount", filteredProductCount);
    //   products = await apiFeature.query.clone();
    // }
    // console.log("products", products);
    // return res.status(200).json({ products, productCount, filteredProductCount });
  }
  else {
    var products = await aggregate(queryOptions, match);
  }

  const filteredProductCount = products.length;
  res.status(200).json({ products, productCount, filteredProductCount });
});

exports.getProductAdmin = catchAsyncError(async (req, res, next) => {
  const { id } = req.params;

  const products = await productModel.aggregate([
    { $match: { _id: new mongoose.Types.ObjectId(id) } },
    {
      $lookup: {
        from: "categories",
        localField: "category",
        foreignField: "_id",
        as: "category"
      }
    },
    { $unwind: { path: "$category", preserveNullAndEmptyArrays: true } },
    {
      $lookup: {
        from: "subproducts",
        localField: "_id",
        foreignField: "pid",
        as: "subProducts"
      }
    }
  ]);
  // await productModel.findById(id).populate("category sub_category");
  if (products.length <= 0) {
    console.log("dfsdjkfsdhfksdhfskjfhsdkf")
    return next(new ErrorHandler("Product not found", 404));
  }
  console.log({ products })
  res.status(200).json({ product: products[0] });
});

exports.getProduct = catchAsyncError(async (req, res, next) => {
  const { id } = req.params;
  const products = await aggregate([], { _id: mongoose.Types.ObjectId(id) });
  if (products.length === 0) return next(new ErrorHandler("Product not found", 404));

  res.status(200).json({ product: products[0] });
});

exports.updateProduct = catchAsyncError(async (req, res, next) => {
  console.log("update product", req.body);
  const { id } = req.params;

  const product = await productModel.findByIdAndUpdate(id, req.body, {
    new: true,
    runValidators: true,
    useFindAndModify: false,
  }).populate("category");
  if (!product) return next(new ErrorHandler("Product not found", 404));

  res.status(200).json({ product });
});

exports.deleteProduct = catchAsyncError(async (req, res, next) => {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) {
    return next(new ErrorHandler("Invalid product id.", 400));
  }

  let product = await productModel.findById(id);
  if (!product) return next(new ErrorHandler("Product not found", 404));

  const subProducts = await subProdModel.find({ pid: product._id }).select("_id");
  const subProductIds = subProducts.map((prod) => prod._id.toString());

  await cartModel.updateMany(
    { "items.product": { $in: subProductIds } }, { $pull: { "items": { product: { $in: subProductIds } } } });

  await subProdModel.deleteMany({ pid: product._id });
  await reviewModel.deleteMany({ product: product._id });
  await saleModel.deleteOne({ product: product._id });
  await product.remove();

  res.status(200).json({
    success: true,
    message: "Product Deleted successfully.",
  });
});

exports.createSubProduct = catchAsyncError(async (req, res, next) => {
  console.log(req.body);
  const subProduct = await subProdModel.create(req.body);

  res.status(200).json({ subProduct });
});

exports.deleteSubProduct = catchAsyncError(async (req, res, next) => {
  const { id } = req.params;

  if (!mongoose.isValidObjectId(id)) {
    return next(new ErrorHandler("Invalid Id.", 400));
  }

  let subProduct = await subProdModel.findById(id);
  if (!subProduct) return next(new ErrorHandler("Variant not found", 404));

  await cartModel.updateMany(
    { "items.product": id }, { $pull: { "items": { product: id } } });

  await subProduct.remove();

  res.status(200).json({
    success: true,
    message: "Variant Deleted successfully.",
  });
});