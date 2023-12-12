const express = require("express");
const router = express.Router();
const { upload } = require("../utils/s3");
const { auth } = require("../middlewares/auth");

const { getUserAllChats, createChat, sendMessage, getUserChat, endChat, getAccessToken } = require("../controllers/chatController");

router.get("/access-token", auth, getAccessToken);
router.get("/", auth, getUserChat);
router.post("/create", auth, createChat);
router.post("/send-msg", auth, upload.single('file'), sendMessage);
// router.route("/:chatID")
//   .get(auth, getUserChat)
//   .put(auth, endChat);

module.exports = router;
