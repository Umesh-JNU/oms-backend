const mongoose = require("mongoose");

const quantitySchema = new mongoose.Schema(
  {
    qname: {
      type: String,
      required: [true, "Name for a quantity is required."],
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Quantity", quantitySchema);
