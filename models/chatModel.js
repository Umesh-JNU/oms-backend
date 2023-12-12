const mongoose = require("mongoose");

const chatSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  active: {
    type: Boolean,
    default: true
  },
  conversationSID: {
    type: String,
    required: [true, "Conversation SID is required."]
  }
}, { timestamps: true });

module.exports = mongoose.model("Chat", chatSchema);
