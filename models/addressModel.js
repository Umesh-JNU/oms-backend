const mongoose = require("mongoose");

const addrSchema = new mongoose.Schema(
  {
    province: {
      type: String,
      required: [true, "Please enter your province."],
    },
    town: {
      type: String,
      required: [true, "Please enter your town/city."],
    },
    street: {
      type: String,
      required: [true, "Please enter your street address."],
    },
    post_code: {
      type: String,
      required: [true, "Please enter your Postcode/ZIP."],
    },
    // unit: {
    //   type: String,
    //   required: [true, "Please enter unit."],
    // },
    defaultAddress: {
      type: Boolean,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Address", addrSchema);

// addrSchema.pre('updateMany', function(next) {
// if ()
//   next()
// })
