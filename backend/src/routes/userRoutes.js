const express = require('express');
const userController = require('../controllers/userController');
const authenticate = require('../middleware/authenticate');
const uploadImage = require('../middleware/uploadImage');

const router = express.Router();

router.post('/me/profile-image', authenticate, uploadImage.single('image'), userController.uploadProfileImage);

module.exports = router;
