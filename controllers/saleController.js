const catchAsyncError = require("../utils/catchAsyncError");
const ErrorHandler = require("../utils/errorHandler");
const { productModel, categoryModel, subProdModel } = require("../models/productModel");
const saleModel = require("../models/saleModel");
const APIFeatures = require("../utils/apiFeatures");
const cron = require("node-cron");

const launchSale = (start_date) => {
	const dt = new Date();
	console.log({ dt });
	const coming_date = new Date(dt.setDate(dt.getDate() + 1)).toISOString().slice(0, 10);
	console.log({ dt, start_date, coming_date });

	return start_date < coming_date;
};

const jobLaunchSale = async () => {
	const today = new Date().toISOString().slice(0, 10);

	const sales = await saleModel.find({});
	for (var i in sales) {
		const { type, discount, start_date, end_date } = sales[i];
		const sd = start_date.toISOString().slice(0, 10);
		const ed = end_date.toISOString().slice(0, 10);

		console.log({ sd, ed, today });
		
		switch (type) {
			case "*":
				console.log({ type });
				if (sd === today)
					await productModel.updateMany({}, { $set: { sale: discount } });

				if (ed === today)
					await productModel.updateMany({}, { $set: { sale: 0 } });
				break;

			case "category":
				console.log({ options });

				const category = await categoryModel.findById(sales[i].category);
				if (!category) break;

				if (sd === today)
					await productModel.updateMany({ category: sales[i].category }, { $set: { sale: discount } });

				if (ed === today)
					await productModel.updateMany({ category: sales[i].category }, { $set: { sale: 0 } });
				break;

			case "product":
				console.log("product");

				const product = await productModel.findById(sales[i].product);
				if (!product) break;

				if (sd === today)
					product.sale = discount;

				if (ed === today)
					product.sale = 0;

				await product.save();
				break;

			default:
				break;
		}
	};
}

exports.createSale = catchAsyncError(async (req, res, next) => {
	const { type, discount, id, start_date, end_date } = req.body;
	let products, saleData = { type, discount, start_date, end_date };

	if (type === "*") {
		// delete all previous sales
		await saleModel.deleteMany({});
		if (launchSale(start_date)) {
			products = await productModel.updateMany({}, { $set: { sale: discount } });
		}
	}
	else {
		// check if on-site sale is going on. 
		// if going on then no new sale can be created, other new category sale will be created.
		let sale_ = await saleModel.findOne({ type: "*" });
		if (sale_) return next(new ErrorHandler("New sale can't be created as on-site sale is going on.", 400));

		if (type === "category") {
			console.log(req.body);
			if (!id) return next(new ErrorHandler("Please provide the category id", 400));

			const category = await categoryModel.findById(id);
			if (!category) return next(new ErrorHandler("Category not found.", 404));

			// delete the previous category sale if going on.
			await saleModel.deleteOne({ category: category._id });

			products = await productModel.find({ category: category._id });
			for (var idx in products) {
				await saleModel.deleteOne({ product: products[idx]._id });
			}

			if (launchSale(start_date)) {
				products = await productModel.updateMany({ category: id }, { $set: { sale: discount } });
			}
			saleData['category'] = id
		}
		else if (type === "product") {
			if (!id) return next(new ErrorHandler("Please provide the product id", 400));

			const product = await productModel.findById(id);
			if (!product) return next(new ErrorHandler("Product not found.", 404));

			sale_ = await saleModel.findOne({ category: product.category });
			if (sale_) return next(new ErrorHandler("New sale can't be created as product's category sale is already going on.", 400));

			// delete the previous product sale if going on
			// console.log({ product })
			// console.log(await saleModel.findOne({ product: product._id }), product._id);
			await saleModel.deleteOne({ product: product._id });

			if (launchSale(start_date)) {
				product.sale = discount;
				await product.save();
			}

			saleData['product'] = id;
			products = [product]
		}
		else return next(new ErrorHandler("Invalid sale type", 400));
	}

	// finally create a new sale 
	const sale = await saleModel.create(saleData);

	cron.schedule("0 0 * * *", jobLaunchSale);

	res.status(200).json({ products, sale });
})

exports.getAllSale = catchAsyncError(async (req, res, next) => {
	const saleCount = await saleModel.countDocuments();
	// console.log("saleCount", saleCount);
	const apiFeature = new APIFeatures(
		saleModel.find().sort({ createdAt: -1 }).populate("category product"),
		req.query
	).search("discount");

	let sales = await apiFeature.query;
	// console.log("sales", sales);
	let filteredSaleCount = sales.length;
	if (req.query.resultPerPage && req.query.currentPage) {
		apiFeature.pagination();

		// console.log("filteredSaleCount", filteredSaleCount);
		sales = await apiFeature.query.clone();
		// console.log("sales1", sales);
	}

	res.status(200).json({ sales, saleCount, filteredSaleCount });
})

exports.getSale = catchAsyncError(async (req, res, next) => {
	const sale = await saleModel.findById(req.params.id).populate("category product")

	if (!sale) return next(new ErrorHandler("Sale not found", 404));

	res.status(200).json({ sale });
})

exports.updateSale = catchAsyncError(async (req, res, next) => {
	const { id } = req.params;
	const sale = await saleModel.findByIdAndUpdate(id, req.body, {
		new: true,
		runValidators: true,
		useFindAndModify: false,
	});
	res.status(200).json({ sale });
});

exports.deleteSale = catchAsyncError(async (req, res, next) => {
	const { id } = req.params;
	const options = { $set: { sale: 0 } };

	let sale = await saleModel.findById(id);

	if (!sale) return next(new ErrorHandler("Sale not found", 404));

	if (sale.type === "*")
		await productModel.updateMany({}, options);
	else if (sale.type === "product")
		await productModel.updateOne({ _id: sale.product }, options);
	else if (sale.type === "category")
		await productModel.updateMany({ category: sale.category }, options);
	else return next(new ErrorHandler("Invalid sale type.", 400));

	await sale.remove();

	res.status(200).json({
		success: true,
		message: "Sale Deleted successfully.",
	});
});
