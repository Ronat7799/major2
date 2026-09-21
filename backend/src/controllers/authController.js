const authService = require('../services/authService');
const { success } = require('../utils/apiResponse');

async function register(req, res, next) {
  try {
    const result = await authService.register(req.body);
    return success(res, 201, 'Registration successful.', result);
  } catch (error) {
    return next(error);
  }
}

async function login(req, res, next) {
  try {
    const result = await authService.login(req.body);
    return success(res, 200, 'Login successful.', result);
  } catch (error) {
    return next(error);
  }
}

async function me(req, res, next) {
  try {
    const user = await authService.getCurrentUser(req.auth.sub);
    return success(res, 200, 'Current user retrieved.', { user });
  } catch (error) {
    return next(error);
  }
}

async function changePassword(req, res, next) {
  try {
    await authService.changePassword(req.auth.sub, req.body.current_password, req.body.new_password);
    return success(res, 200, 'Password updated.');
  } catch (error) {
    return next(error);
  }
}

module.exports = { register, login, me, changePassword };
