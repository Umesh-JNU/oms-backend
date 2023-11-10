const mongoose = require("mongoose");

const couponSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: [true, "User is required"],
    },
    amount: {
      type: Number,
      default: 10,
    },
    status: {
      type: String,
      default: "valid",
      enum: ["valid", "used", "expired"],
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Coupon", couponSchema);
