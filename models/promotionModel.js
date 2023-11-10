const mongoose = require('mongoose');

const promotionSchema = new mongoose.Schema({
    promo_image: {
        type: String,
        required: [true, "Please select a image for promotion."]
    }
}, {timestamps: true});

module.exports = mongoose.model("Promotion", promotionSchema);