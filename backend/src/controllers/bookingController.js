const bookingService = require('../services/bookingService');
const { success } = require('../utils/apiResponse');

async function listMine(req, res, next) {
  try {
    const isVendor = req.auth.role === 'vendor';
    const bookings = isVendor
      ? await bookingService.listVendorBookings(req.auth.vendor_id)
      : await bookingService.listMyBookings(req.auth.sub);
    return success(res, 200, 'Bookings retrieved.', { bookings });
  } catch (error) {
    return next(error);
  }
}

async function getOne(req, res, next) {
  try {
    const isVendor = req.auth.role === 'vendor';
    const booking = isVendor
      ? await bookingService.getBookingDetailForVendor(req.auth.vendor_id, req.params.id)
      : await bookingService.getBookingDetailForCustomer(req.auth.sub, req.params.id);
    return success(res, 200, 'Booking retrieved.', { booking });
  } catch (error) {
    return next(error);
  }
}

async function complete(req, res, next) {
  try {
    const booking = await bookingService.markBookingCompleted(req.auth.vendor_id, req.params.id);
    return success(res, 200, 'Booking marked as completed.', { booking });
  } catch (error) {
    return next(error);
  }
}

async function cancel(req, res, next) {
  try {
    const booking = await bookingService.cancelBooking(req.auth.vendor_id, req.params.id, req.body.reason);
    return success(res, 200, 'Booking cancelled.', { booking });
  } catch (error) {
    return next(error);
  }
}

async function getStatusSummary(req, res, next) {
  try {
    const summary = await bookingService.getBookingStatusSummary(req.auth.vendor_id);
    return success(res, 200, 'Booking status summary retrieved.', { summary });
  } catch (error) {
    return next(error);
  }
}

module.exports = { listMine, getOne, complete, cancel, getStatusSummary };
