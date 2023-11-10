const express = require("express");
const {
  getAllQuantities,
  getQuantity,
} = require("../controllers/quantityController");
const router = express.Router();

router.get("/all", getAllQuantities);
router.route("/:id").get(getQuantity);

module.exports = router;
