const userService = require('../services/userService');
const { success } = require('../utils/apiResponse');

async function uploadProfileImage(req, res, next) {
  try {
    const user = await userService.updateMyProfileImage(req.auth.sub, req.file);
    return success(res, 200, 'Profile photo updated.', { user });
  } catch (error) {
    return next(error);
  }
}

module.exports = { uploadProfileImage };
