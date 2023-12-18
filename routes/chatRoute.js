const express = require("express");
const router = express.Router();
const { auth } = require("../middlewares/auth");

const { getAccessToken, updateReadHorizon } = require("../controllers/chatController");

router.get("/access-token", auth, getAccessToken);
router.put("/read-horizon", auth, updateReadHorizon);

module.exports = router;
