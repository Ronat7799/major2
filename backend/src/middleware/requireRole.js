const AppError = require('../utils/AppError');

function requireRole(role) {
  return function (req, res, next) {
    if (!req.auth || req.auth.role !== role) {
      return next(new AppError(403, 'You do not have permission to access this resource.'));
    }
    return next();
  };
}

module.exports = requireRole;
