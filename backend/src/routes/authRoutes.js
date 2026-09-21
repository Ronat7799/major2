const express = require('express');
const authController = require('../controllers/authController');
const authenticate = require('../middleware/authenticate');
const {
  registerRules,
  loginRules,
  changePasswordRules,
  validateRequest,
} = require('../middleware/validateRequest');

const router = express.Router();

router.post('/register', registerRules, validateRequest, authController.register);
router.post('/login', loginRules, validateRequest, authController.login);
router.get('/me', authenticate, authController.me);
router.post(
  '/change-password',
  authenticate,
  changePasswordRules,
  validateRequest,
  authController.changePassword
);

module.exports = router;
