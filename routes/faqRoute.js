const express = require("express");
const { getAllFaq, getFaq } = require("../controllers/faqController");
const router = express.Router();

router.get("/all", getAllFaq);
router.get("/:id", getFaq);

module.exports = router;
