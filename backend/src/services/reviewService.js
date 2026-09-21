const AppError = require('../utils/AppError');
const reviewModel = require('../models/reviewModel');
const bookingModel = require('../models/bookingModel');

// A customer can only review a booking they own once it's completed — the
// DB's unique index on booking_id backs up the "one review per booking"
// rule at the data layer too.
async function createReviewForBooking(customerId, bookingId, payload) {
  const booking = await bookingModel.findByIdForUser(bookingId, customerId);
  if (!booking) {
    throw new AppError(404, 'Booking not found.');
  }

  if (booking.status !== 'completed') {
    throw new AppError(409, 'Only a completed booking can be reviewed.');
  }

  const review = await reviewModel.createReview({
    booking_id: booking.id,
    user_id: customerId,
    vendor_id: booking.vendor_id,
    rating: payload.rating,
    comment: payload.comment ? String(payload.comment).trim() : null,
  });

  return {
    id: review.id,
    bookingId: review.booking_id,
    rating: review.rating,
    comment: review.comment,
    createdAt: review.created_at,
  };
}

module.exports = { createReviewForBooking };
