const express = require("express");
const {
  getAllCategories,
  getCategory,
  getSubCategory,
  getAllProducts,
  getAllSubCategory,
} = require("../controllers/categoryController");
const router = express.Router();

router.get("/all", getAllCategories);
router.get("/all-subCategories", getAllSubCategory);
router.get("/:id/subCategories", getSubCategory);
router.get("/:id/products", getAllProducts);
router.get("/:id", getCategory);

module.exports = router;
