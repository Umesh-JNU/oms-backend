const mongoose = require('mongoose');

const bannerSchema = new mongoose.Schema({
    img_url: {
        type: String,
        required: [true, "Please select a image for banner."]
    }
}, {timestamps: true});

module.exports = mongoose.model("Banner", bannerSchema);