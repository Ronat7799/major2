const express = require('express');
const quotationRequestController = require('../controllers/quotationRequestController');
const quotationController = require('../controllers/quotationController');
const authenticate = require('../middleware/authenticate');
const requireRole = require('../middleware/requireRole');
const uploadImage = require('../middleware/uploadImage');
const { quotationRequestRules, quotationRules, validateRequest } = require('../middleware/validateRequest');
const { MAX_INSPIRATION_IMAGES } = require('../services/quotationRequestService');

const router = express.Router();

router.post(
  '/',
  authenticate,
  requireRole('customer'),
  uploadImage.array('images', MAX_INSPIRATION_IMAGES),
  quotationRequestRules,
  validateRequest,
  quotationRequestController.submit
);

router.get('/', authenticate, requireRole('vendor'), quotationRequestController.listMine);

router.get('/:id', authenticate, requireRole('vendor'), quotationRequestController.getOne);

router.post(
  '/:id/quotation',
  authenticate,
  requireRole('vendor'),
  quotationRules,
  validateRequest,
  quotationController.create
);

router.post('/:id/decline', authenticate, requireRole('vendor'), quotationRequestController.decline);

router.post('/:id/cancel', authenticate, requireRole('customer'), quotationRequestController.cancel);

module.exports = router;
