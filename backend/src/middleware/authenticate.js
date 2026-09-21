const { verifyAuthToken } = require('../utils/token');
const AppError = require('../utils/AppError');

function authenticate(req, res, next) {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return next(new AppError(401, 'Authentication token is required.'));
  }

  try {
    req.auth = verifyAuthToken(token);
    return next();
  } catch (error) {
    return next(new AppError(401, 'Invalid or expired token.'));
  }
}

module.exports = authenticate;
