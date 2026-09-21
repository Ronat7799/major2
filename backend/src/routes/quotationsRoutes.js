const express = require('express');
const quotationController = require('../controllers/quotationController');
const authenticate = require('../middleware/authenticate');
const requireRole = require('../middleware/requireRole');
const { quotationRules, revisionRequestRules, validateRequest } = require('../middleware/validateRequest');

const router = express.Router();

router.get('/', authenticate, requireRole('customer'), quotationController.listMine);

router.get('/:id', authenticate, requireRole('customer'), quotationController.getOne);

router.post('/:id/accept', authenticate, requireRole('customer'), quotationController.accept);

router.post('/:id/decline', authenticate, requireRole('customer'), quotationController.decline);

router.post(
  '/:id/request-changes',
  authenticate,
  requireRole('customer'),
  revisionRequestRules,
  validateRequest,
  quotationController.requestChanges
);

router.post(
  '/:id/revise',
  authenticate,
  requireRole('vendor'),
  quotationRules,
  validateRequest,
  quotationController.revise
);

router.post('/:id/chat-invite', authenticate, requireRole('vendor'), quotationController.sendChatInvite);

module.exports = router;
