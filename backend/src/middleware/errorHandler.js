const AppError = require('../utils/AppError');
const { fail } = require('../utils/apiResponse');

function errorHandler(err, req, res, next) {
  if (res.headersSent) {
    return next(err);
  }

  if (err instanceof AppError) {
    return fail(res, err.statusCode, err.message);
  }

  console.error(err);
  return fail(res, 500, 'Something went wrong. Please try again.');
}

function notFound(req, res) {
  return fail(res, 404, `Route ${req.method} ${req.originalUrl} was not found.`);
}

module.exports = { errorHandler, notFound };
