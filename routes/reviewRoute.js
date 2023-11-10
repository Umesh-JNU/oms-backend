const express = require("express");
const {
  addReview,
  getAllReview,
  getReview,
} = require("../controllers/reviewController");
const { auth } = require("../middlewares/auth");
const router = express.Router();

router.post("/create", auth, addReview);
router.get("/all/:product", getAllReview);
router.get("/:product", auth, getReview)

module.exports = router;
