const AppError = require('../utils/AppError');
const userModel = require('../models/userModel');
const storageService = require('./storageService');
const { toPublicUser } = require('../utils/userView');

async function updateMyProfileImage(userId, file) {
  if (!file) {
    throw new AppError(400, 'An image file is required.');
  }

  const imageUrl = await storageService.uploadUserImage('customer-avatars', userId, file);
  const user = await userModel.updateProfileImage(userId, imageUrl);

  return toPublicUser(user);
}

module.exports = {
  updateMyProfileImage,
};
