const express = require("express");
const { getAllShipping, getShipping } = require("../controllers/shippingController");
const router = express.Router();

router.get("/all", getAllShipping);
router.get("/:id", getShipping);

module.exports = router;
