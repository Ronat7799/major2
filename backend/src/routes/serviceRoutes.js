const express = require('express');
const serviceController = require('../controllers/serviceController');
const authenticate = require('../middleware/authenticate');
const requireRole = require('../middleware/requireRole');
const uploadImage = require('../middleware/uploadImage');
const { serviceRules, validateRequest } = require('../middleware/validateRequest');
const { MAX_SERVICE_IMAGES } = require('../services/serviceService');

const router = express.Router();

router.get('/', authenticate, requireRole('vendor'), serviceController.listMine);

router.get('/mine/options', authenticate, requireRole('vendor'), serviceController.listMineOptions);

router.get('/:id', authenticate, requireRole('vendor'), serviceController.getOne);

router.post(
  '/',
  authenticate,
  requireRole('vendor'),
  uploadImage.array('images', MAX_SERVICE_IMAGES),
  serviceRules,
  validateRequest,
  serviceController.createService
);

router.put(
  '/:id',
  authenticate,
  requireRole('vendor'),
  uploadImage.array('images', MAX_SERVICE_IMAGES),
  serviceRules,
  validateRequest,
  serviceController.update
);

router.delete('/:id', authenticate, requireRole('vendor'), serviceController.remove);

module.exports = router;
