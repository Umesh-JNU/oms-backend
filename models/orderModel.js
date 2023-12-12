const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const orderSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    products: [
      {
        product: {
          type: Object,
          required: true,
        },
        quantity: {
          type: Number,
          default: 1,
        },
        parent_prod: {
          type: Object,
          required: true,
        },
        // updatedAmount: {
        //   type: Number,
        // }
      },
    ],
    // amount: {
    //   type: Number,
    //   required: true,
    //   // min: [60, "Order can only be placed for amount at least 60"]
    // },
    // shipping_charge: {
    //   type: Number,
    //   required: true,
    // },
    // free_ship: {
    //   type: Boolean,
    //   default: false
    // },
    address: {
      province: {
        type: String,
        required: true,
      },
      town: {
        type: String,
        required: true,
      },
      street: {
        type: String,
        required: true,
      },
      post_code: {
        type: String,
        required: true,
      },
      // unit: {
      //   type: String,
      //   required: true,
      // },
      mobile_no: {
        type: Number,
        required: true,
      }
    },
    // status: {
    //   type: String,
    //   default: "in-progress",
    //   enum: ["in-progress", "paid", "delivered", "cancelled"],
    // },
    orderId: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Order", orderSchema);
