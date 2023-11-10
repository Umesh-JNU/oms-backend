const mongoose = require("mongoose");

const getDate = (value) => {
	if(value) return new Date(value).toISOString().slice(0, 10);
	return new Date().toISOString().slice(0, 10);
}

const saleSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["*", "product", "category"],
    },
    start_date: {
      type: Date,
      required: [true, "Start date is required."],
      validate: {
        validator: function (value) {
					console.log(typeof value);
					// console.log(value.slice(0, 10), new Date().toISOString().slice(0, 10));
          return getDate(value) >= getDate(); // Check if start_date is greater than or equal to today
        },
        message: "Start date must be greater than or equal to today.",
      },
    },
    end_date: {
      type: Date,
      required: [true, "End date is required."],
      validate: {
        validator: function (value) {
          return value > this.start_date; // Check if end_date is greater than start_date
        },
        message: "End date must be greater than the start date.",
      },
    },
    discount: {
      type: Number,
      required: [true, "Discount is required"]
    },
    category: { type: mongoose.Schema.Types.ObjectId, ref: "Category" },
    product: { type: mongoose.Schema.Types.ObjectId, ref: "Product" }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Sale", saleSchema);