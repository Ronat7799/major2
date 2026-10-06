const express = require('express');
const bookingController = require('../controllers/bookingController');
const reviewController = require('../controllers/reviewController');
const paymentController = require('../controllers/paymentController');
const authenticate = require('../middleware/authenticate');
const requireRole = require('../middleware/requireRole');
const { reviewRules, cancelBookingRules, validateRequest } = require('../middleware/validateRequest');

const router = express.Router();

router.get('/', authenticate, bookingController.listMine);

router.get('/status-summary', authenticate, requireRole('vendor'), bookingController.getStatusSummary);

router.get('/:id', authenticate, bookingController.getOne);

router.post('/:id/complete', authenticate, requireRole('vendor'), bookingController.complete);

router.post(
  '/:id/cancel',
  authenticate,
  requireRole('vendor'),
  cancelBookingRules,
  validateRequest,
  bookingController.cancel
);

router.post('/:id/pay-deposit', authenticate, requireRole('customer'), paymentController.createDepositIntent);

router.post('/:id/pay-balance', authenticate, requireRole('customer'), paymentController.createBalanceIntent);

router.post('/:id/simulate-deposit', authenticate, requireRole('customer'), paymentController.simulateDeposit);

router.post('/:id/simulate-balance', authenticate, requireRole('customer'), paymentController.simulateBalance);

router.post(
  '/:id/review',
  authenticate,
  requireRole('customer'),
  reviewRules,
  validateRequest,
  reviewController.create
);

module.exports = router;
