const express = require('express');
const savedServiceController = require('../controllers/savedServiceController');
const authenticate = require('../middleware/authenticate');
const requireRole = require('../middleware/requireRole');
const { savedServiceRules, validateRequest } = require('../middleware/validateRequest');

const router = express.Router();

router.use(authenticate, requireRole('customer'));

router.get('/', savedServiceController.listMine);
router.get('/ids', savedServiceController.listMyIds);
router.post('/', savedServiceRules, validateRequest, savedServiceController.save);
router.delete('/:serviceId', savedServiceController.unsave);

module.exports = router;
