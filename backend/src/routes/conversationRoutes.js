const express = require('express');
const conversationController = require('../controllers/conversationController');
const authenticate = require('../middleware/authenticate');
const requireRole = require('../middleware/requireRole');
const { messageRules, respondToInviteRules, validateRequest } = require('../middleware/validateRequest');

const router = express.Router();

router.get('/', authenticate, conversationController.listMine);

router.get('/:id', authenticate, conversationController.getOne);

router.post('/:id/messages', authenticate, messageRules, validateRequest, conversationController.sendMessage);

router.post('/:id/read', authenticate, conversationController.markRead);

router.post(
  '/:id/respond',
  authenticate,
  requireRole('customer'),
  respondToInviteRules,
  validateRequest,
  conversationController.respondToInvite
);

module.exports = router;
