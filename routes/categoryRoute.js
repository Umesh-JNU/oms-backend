const express = require("express");
const router = express.Router();
const { getAllCategories, getCategory, getAllProducts } = require("../controllers/categoryController");

router.get("/all", getAllCategories);
router.get("/:name/products", getAllProducts);
router.get("/:id", getCategory);

module.exports = router;
