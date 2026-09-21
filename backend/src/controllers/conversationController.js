const conversationService = require('../services/conversationService');
const { success } = require('../utils/apiResponse');

async function listMine(req, res, next) {
  try {
    const conversations = await conversationService.listConversationsForAuth(req.auth);
    return success(res, 200, 'Conversations retrieved.', { conversations });
  } catch (error) {
    return next(error);
  }
}

async function getOne(req, res, next) {
  try {
    const conversation = await conversationService.getConversationDetail(req.auth, req.params.id);
    return success(res, 200, 'Conversation retrieved.', { conversation });
  } catch (error) {
    return next(error);
  }
}

async function sendMessage(req, res, next) {
  try {
    const message = await conversationService.sendMessage(req.auth, req.params.id, req.body.message);
    return success(res, 201, 'Message sent.', { message });
  } catch (error) {
    return next(error);
  }
}

async function markRead(req, res, next) {
  try {
    await conversationService.markConversationRead(req.auth, req.params.id);
    return success(res, 200, 'Conversation marked as read.');
  } catch (error) {
    return next(error);
  }
}

async function respondToInvite(req, res, next) {
  try {
    const conversation = await conversationService.respondToInvite(req.auth, req.params.id, req.body.decision);
    return success(res, 200, 'Invite response saved.', conversation);
  } catch (error) {
    return next(error);
  }
}

module.exports = { listMine, getOne, sendMessage, markRead, respondToInvite };
