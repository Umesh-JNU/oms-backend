const express = require("express");
const {
  getAllSubCategories,
  getSubCategory,
  getAllProducts,
} = require("../controllers/subCategoryController");
const router = express.Router();

router.get("/all", getAllSubCategories);
router.get("/:id/products", getAllProducts);
router.get("/:id", getSubCategory);

module.exports = router;
