const mongoose = require('mongoose');

const shippingSchema = new mongoose.Schema(
  {
    label: {
      type: String,
      default: 'Local',
      enum: ['Local', 'Provincial', 'National']
    },
    charge: {
      type: Number,
      required: [true, 'Shipping Charge is required']
    },
    description: {
      type: String,
      required: [true, 'Description for shipping is required.']
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Shipping', shippingSchema);