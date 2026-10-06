const express = require('express');
const vendorController = require('../controllers/vendorController');
const vendorPayoutController = require('../controllers/vendorPayoutController');
const authenticate = require('../middleware/authenticate');
const requireRole = require('../middleware/requireRole');
const uploadImage = require('../middleware/uploadImage');
const { vendorProfileRules, validateRequest } = require('../middleware/validateRequest');

const router = express.Router();

router.get('/', vendorController.listBrowse);
router.get('/featured', vendorController.listFeatured);

router.get('/me', authenticate, requireRole('vendor'), vendorController.getMyProfile);
router.get('/me/revenue', authenticate, requireRole('vendor'), vendorController.getMyRevenue);
router.get('/me/revenue-series', authenticate, requireRole('vendor'), vendorController.getMyRevenueSeries);
router.get('/me/top-services', authenticate, requireRole('vendor'), vendorController.getMyTopServices);
router.get('/me/stats', authenticate, requireRole('vendor'), vendorController.getMyStats);
router.get('/me/upcoming-events', authenticate, requireRole('vendor'), vendorController.getMyUpcomingEvents);
router.get('/me/attention', authenticate, requireRole('vendor'), vendorController.getMyAttentionSummary);
router.get('/me/recent-activity', authenticate, requireRole('vendor'), vendorController.getMyRecentActivity);
router.get('/me/notifications', authenticate, requireRole('vendor'), vendorController.getMyNotifications);
router.get(
  '/me/notifications/unread-count',
  authenticate,
  requireRole('vendor'),
  vendorController.getMyUnreadNotificationCount
);
router.post(
  '/me/notifications/read',
  authenticate,
  requireRole('vendor'),
  vendorController.markMyNotificationsRead
);
router.put(
  '/me',
  authenticate,
  requireRole('vendor'),
  vendorProfileRules,
  validateRequest,
  vendorController.updateMyProfile
);
router.post(
  '/me/profile-image',
  authenticate,
  requireRole('vendor'),
  uploadImage.single('image'),
  vendorController.uploadProfileImage
);
router.post(
  '/me/cover-image',
  authenticate,
  requireRole('vendor'),
  uploadImage.single('image'),
  vendorController.uploadCoverImage
);
router.get('/me/reviews', authenticate, requireRole('vendor'), vendorController.getMyReviews);
router.post(
  '/me/stripe/onboarding-link',
  authenticate,
  requireRole('vendor'),
  vendorPayoutController.createOnboardingLink
);
router.get('/me/stripe/status', authenticate, requireRole('vendor'), vendorPayoutController.getStatus);

router.get('/:id/availability', vendorController.getVendorAvailability);

router.get('/:id', vendorController.getVendorDetail);

module.exports = router;
