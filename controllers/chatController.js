const catchAsyncError = require("../utils/catchAsyncError");
const ErrorHandler = require("../utils/errorHandler");
const chatModel = require("../models/chatModel");
const userModel = require("../models/userModel");

const { s3Uploadv2 } = require("../utils/s3");
// const accountSid = process.env.TWILIO_ACCOUNT_SID;
// const authToken = process.env.TWILIO_AUTH_TOKEN;
// const serviceSid = process.env.SERVICE_SID;
const accountSid = process.env.ACCOUNT_SID;
const authToken = process.env.AUTH_TOKEN;
const serviceSid = process.env.S_SID;
const api_key = process.env.API_KEY;
const api_secret_key = process.env.API_SECRET_KEY;

const client = require('twilio')(accountSid, authToken);
client.conversations.v1.services(serviceSid).configuration().update({
  reachabilityEnabled: true
}).then(config => console.log({ config })).catch(err => console.log({ err }));

const AccessToken = require('twilio').jwt.AccessToken;

const ChatGrant = AccessToken.ChatGrant;
const chatGrant = new ChatGrant({
  serviceSid: serviceSid,
});

const conversationSID = () => {
  console.log("create a conversation")
  return new Promise((resolve, reject) => {
    client.conversations.v1.services(serviceSid)
      .conversations.create()
      .then(conversation => {
        console.log("conversation sid = ", conversation.sid);
        resolve(conversation.sid);
      })
      .catch(error => reject(error));
  });
}

const createParticipant = async (convSID, userInfo) => {
  console.log(`add participant in ${convSID} as identity ${userInfo} ${userInfo}`);
  return await client.conversations.v1.services(serviceSid).conversations(convSID).participants.create({
    identity: userInfo._id.toString(),
    attributes: JSON.stringify({
      name: `${userInfo.firstname} ${userInfo.lastname}`,
      profile_img: userInfo.profile_img
    }),
  });
}

const createNewChat = async (userId, adminId, res, next) => {
  const user = await userModel.findById(userId);
  if (!user) {
    return next(new ErrorHandler("User Not Found.", 404));
  }

  let chat = await chatModel.findOne({ user: userId, active: true });
  if (!chat) {
    const convSID = await conversationSID();
    const participant1 = await createParticipant(convSID, { identity: userId, friendlyName: `${user.firstname} ${user.lastname}` });
    const participant2 = await createParticipant(convSID, adminId);

    // create new chat
    chat = await (await chatModel.create({
      user: userId,
      conversationSID: convSID,
    })).populate('user');
    console.log({ chat, participant1, participant2 })
  }

  res.status(201).json({ success: true, chat });
};

exports.getAccessToken = catchAsyncError(async (req, res, next) => {
  const userId = req.userId;
  const user = await userModel.findById(userId);
  if (!user) {
    return next(new ErrorHandler("User Not Found", 404));
  }

  const token = new AccessToken(
    accountSid,
    api_key,
    api_secret_key,
    { identity: userId }
  );
  token.addGrant(chatGrant);

  if (req.user && req.user.role === 'admin') {
    return res.status(200).json({ access_token: token.toJwt() });
  }

  let chat = await chatModel.findOne({ user: userId });
  if (!chat) {
    const admin = await userModel.findOne({ role: 'admin' });

    const convSID = await conversationSID();
    const participant1 = await createParticipant(convSID, user);
    const participant2 = await createParticipant(convSID, admin);

    // create new chat
    chat = await chatModel.create({
      user: userId,
      conversationSID: convSID,
    });
    console.log({ chat, participant1, participant2 })
  }
  return res.status(200).json({ access_token: token.toJwt(), chat, token });
});

exports.getUserAllChats = catchAsyncError(async (req, res, next) => {
  const userId = req.userId;
  const chats = await chatModel.find({ user: userId }).sort({ active: -1, createdAt: -1 });
  res.status(200).json({ chats });
});

exports.getUserChat = catchAsyncError(async (req, res, next) => {
  const userId = req.userId;
  console.log("getting all message", { userId });

  const chat = await chatModel.findOne({ user: userId });
  if (!chat) {
    return next(new ErrorHandler("Chat Not Found", 404));
  }

  const allMsg = await client.conversations.v1.services(serviceSid)
    .conversations(chat.conversationSID)
    .messages.list()
  res.status(200).json({ chat, allMsg })
});

exports.sendMessage = catchAsyncError(async (req, res, next) => {
  const userId = req.userId;
  const { chatID, message } = req.body;

  console.log({ chatID, userId });
  const user = await userModel.findById(userId);
  if (!user) {
    return next(new ErrorHandler("User Not Found", 404));
  }

  // check if there is any active chat
  chat = await chatModel.findOne({ user: userId, _id: chatID, active: true });
  if (!chat) {
    return next(new ErrorHandler("Chat Not Found", 404));
  }

  let body = {
    author: user?.firstname + ' ' + user?.lastname,
  };

  if (req.file) {
    const results = await s3Uploadv2(req.file, 'chats');
    const location = results.Location && results.Location;
    body.body = req.file.originalname;
    body.attributes = JSON.stringify({
      url: location,
      content_type: req.file.mimetype
    });
  }
  else {
    if (!message) {
      const allMsg = await client.conversations.v1.services(serviceSid)
        .conversations(chat.conversationSID)
        .messages.list()

      return res.status(200).json({ allMsg });
    }
    body.body = message;
  }

  if (!chat.active) {
    return next(new ErrorHandler("Bad Request", 400));
  }

  const sentMessage = await client.conversations.v1.services(serviceSid)
    .conversations(chat.conversationSID)
    .messages.create(body);
  console.log({ sentMessage });

  const allMsg = await client.conversations.v1.services(serviceSid)
    .conversations(chat.conversationSID)
    .messages.list()
  res.status(200).json({ allMsg })
});

exports.endChat = catchAsyncError(async (req, res, next) => {
  const { chatID } = req.params;
  const userId = req.userId;
  console.log({ chatID, userId })
  const chat = await chatModel.findOneAndUpdate({ user: userId, _id: chatID, active: true }, { active: false }, {
    new: true,
    runValidators: true,
    useFindAndModify: false
  });
  if (!chat) {
    return next(new ErrorHandler("Chat Not Found", 404));
  }
  res.status(200).json({ success: true });
});

exports.createChat = catchAsyncError(async (req, res, next) => {
  const { isAdmin } = req.query;

  if (isAdmin && req.user) {
    console.log("Admin create chat")
    const user = await userModel.findById(req.body.userId);
    if (!user) {
      return next(new ErrorHandler("User Not Found.", 404));
    }

    return await createNewChat(req.body.userId, req.userId, res, next);
  }

  console.log("User create chat");
  const admin = await userModel.findOne({ role: 'admin' });
  await chatModel.updateMany({ user: req.userId }, { active: false });
  await createNewChat(req.userId, admin._id.toString(), res, next);
});


// Admin 
exports.getAllChats = catchAsyncError(async (req, res, next) => {
  const chats = await chatModel.find({ active: true }).sort({ createdAt: 1 }).populate('user');
  res.status(200).json({ chats });
});

exports.getChat = catchAsyncError(async (req, res, next) => {
  const { id } = req.params;
  console.log("getting all message", { id });

  const chat = await chatModel.findById(id);
  if (!chat) {
    return next(new ErrorHandler("Chat Not Found", 404));
  }
  const allMsg = await client.conversations.v1.services(serviceSid)
    .conversations(chat.conversationSID)
    .messages.list()
  res.status(200).json({ allMsg })
});

exports.sendMessageAdmin = catchAsyncError(async (req, res, next) => {
  console.log("body", req.body, req.file);
  const { chatID, message } = req.body;

  const chat = await chatModel.findById(chatID);
  if (!chat) {
    return next(new ErrorHandler("Chat Not Found", 404));
  }

  const user = req.user;
  let body = {
    author: user?.firstname + ' ' + user?.lastname,
  };

  if (req.file) {
    const results = await s3Uploadv2(req.file, 'chats');
    const location = results.Location && results.Location;
    body.body = req.file.originalname;
    body.attributes = JSON.stringify({
      url: location,
      content_type: req.file.mimetype
    });
  }
  else {
    if (!message) {
      const allMsg = await client.conversations.v1.services(serviceSid)
        .conversations(chat.conversationSID)
        .messages.list()

      return res.status(200).json({ allMsg });
    }
    body.body = message;
  }

  if (!chat.active) {
    return next(new ErrorHandler("Bad Request", 400));
  }

  console.log({ body })
  const sentMessage = await client.conversations.v1.services(serviceSid)
    .conversations(chat.conversationSID)
    .messages.create(body);
  console.log({ sentMessage });

  const allMsg = await client.conversations.v1.services(serviceSid)
    .conversations(chat.conversationSID)
    .messages.list()
  res.status(200).json({ allMsg })
});
