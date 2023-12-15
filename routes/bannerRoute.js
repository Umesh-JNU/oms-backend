const express = require("express");
const { getAllBanner } = require("../controllers/bannerController");
const router = express.Router();

router.get("/all", getAllBanner);

module.exports = router;
