const catchAsyncError = require("../utils/catchAsyncError");
const ErrorHandler = require("../utils/errorHandler");
const chatModel = require("../models/chatModel");
const userModel = require("../models/userModel");

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

exports.updateParticipant = async (userInfo) => {
  let chat = await chatModel.findOne({ user: userInfo._id });
  if (chat) {
    try {
      const participant = await client.conversations.v1.services(serviceSid).conversations(chat.conversationSID)
        .participants(userInfo._id.toString())
        .fetch();
      console.log("UPDATE PARTICIPANT", { participant });

      await client.conversations.v1.services(serviceSid).conversations(chat.conversationSID).participants(participant.sid).update({
        attributes: JSON.stringify({
          name: `${userInfo.firstname} ${userInfo.lastname}`,
          profile_img: userInfo.profile_img
        }),
      });
    } catch (error) {
      console.log("UPDATE PARTICIPANT ERROR", error);
    }
  }
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

exports.createChat = catchAsyncError(async (req, res, next) => {
  const { userId } = req.body;
  const user = await userModel.findById(userId);
  if (!user) {
    return next(new ErrorHandler("User Not Found", 404));
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

  return res.status(201).json({ success: true });
});


exports.updateReadHorizon = catchAsyncError(async (req, res, next) => {
  console.log("UPDATE READ HORIZON", req.body);
  const { convSID } = req.body;

  const lastMsg = await client.conversations.v1.services(serviceSid).conversations(convSID).messages.list({ order: 'desc', limit: 1 });
  const { index, participantSid } = lastMsg[0];
  console.log({ lastMsg, index, participantSid });
  await client.conversations.v1.services(serviceSid).conversations(convSID).participants(participantSid).update({
    lastReadMessageIndex: index,
    lastReadTimestamp: new Date()
  });

  res.status(200).json({ success: true });
});