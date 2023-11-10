const express = require("express");
const {
  addItem,
  updateItem,
  deleteItem,
  getItems,
  recentCart,
} = require("../controllers/cartController");
const { auth } = require("../middlewares/auth");
const router = express.Router();

router.post("/add", auth, addItem);
router.get("/all", auth, getItems);
router.post("/recent-cart", auth, recentCart);
router.route("/item/:id").put(auth, updateItem).delete(auth, deleteItem);

module.exports = router;
