const AppError = require('../utils/AppError');
const userModel = require('../models/userModel');
const storageService = require('./storageService');
const { toPublicUser } = require('../utils/userView');

// Personal avatar, independent of a vendor's own company logo — any
// authenticated user (customer or vendor) can set one for themselves.
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
