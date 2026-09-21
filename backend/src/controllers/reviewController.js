const reviewService = require('../services/reviewService');
const { success } = require('../utils/apiResponse');

async function create(req, res, next) {
  try {
    const review = await reviewService.createReviewForBooking(req.auth.sub, req.params.id, req.body);
    return success(res, 201, 'Review submitted.', { review });
  } catch (error) {
    return next(error);
  }
}

module.exports = { create };
