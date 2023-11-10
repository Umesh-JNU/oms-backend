const mongoose = require("mongoose");

const cartSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  items: [{
      product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "SubProduct",
      },
      quantity: {
        type: Number,
      },
    }],
}, {timestamps: true});

module.exports = mongoose.model("Cart", cartSchema);
