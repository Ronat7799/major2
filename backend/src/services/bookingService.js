const AppError = require('../utils/AppError');
const bookingModel = require('../models/bookingModel');
const quotationModel = require('../models/quotationModel');
const quotationRequestModel = require('../models/quotationRequestModel');
const reviewModel = require('../models/reviewModel');
const paymentModel = require('../models/paymentModel');
const paymentService = require('./paymentService');
const conversationService = require('./conversationService');

const STATUS_LABELS = {
  confirmed: 'Confirmed',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

function formatBookingCode(id) {
  return `BK-${id.replace(/-/g, '').slice(0, 8).toUpperCase()}`;
}

// Overlays the DB's own confirmed/completed/cancelled status with
// 'Pending Payment' whenever a confirmed booking's deposit or balance is
// still outstanding — completed/cancelled bookings are shown as-is since
// payment state stops mattering for the label once a booking is final.
function bookingStatusLabel(dbStatus, paymentSummary) {
  const base = STATUS_LABELS[dbStatus] || 'Confirmed';
  if (base === 'Confirmed' && !paymentSummary.fullyPaid) {
    return 'Pending Payment';
  }
  return base;
}

// Vendor-only payment-status badge vocabulary, independent of the booking
// status above. 'Not Available' = no payment row exists at all yet;
// 'Partially Paid' = deposit paid, balance still outstanding; 'Paid' =
// fully paid (balance paid, or a legacy fully-paid 'full' row); 'Unpaid' =
// a stage exists but hasn't succeeded.
function vendorPaymentStatusLabel(paymentSummary) {
  if (paymentSummary.fullyPaid) return 'Paid';
  if (paymentSummary.deposit.paid) return 'Partially Paid';
  if (paymentSummary.deposit.status) return 'Unpaid';
  return 'Not Available';
}

// Groups a flat list of payment rows (possibly several per booking) into a
// Map<booking_id, Payment[]> for batch list pages.
function groupPaymentsByBooking(payments) {
  const map = new Map();
  for (const payment of payments) {
    const list = map.get(payment.booking_id) || [];
    list.push(payment);
    map.set(payment.booking_id, list);
  }
  return map;
}

async function ratingForVendor(vendorId) {
  const reviews = await reviewModel.findByVendorId(vendorId);
  const total = reviews.length;
  const average = total ? Number((reviews.reduce((sum, review) => sum + review.rating, 0) / total).toFixed(1)) : null;
  return { average, total };
}

// A customer's own bookings, newest first — each one backed by the quotation
// and event details of the request it was created from.
async function listMyBookings(customerId) {
  const bookings = await bookingModel.listByUserId(customerId);
  if (!bookings.length) {
    return [];
  }

  const quotationIds = [...new Set(bookings.map((booking) => booking.quotation_id))];
  const quotations = await quotationModel.findByIds(quotationIds);
  const quotationById = new Map(quotations.map((quotation) => [quotation.id, quotation]));

  const requestIds = [...new Set(quotations.map((quotation) => quotation.quotation_request_id))];
  const requests = await quotationRequestModel.findByIds(requestIds);
  const requestById = new Map(requests.map((request) => [request.id, request]));

  const vendorIds = [...new Set(bookings.map((booking) => booking.vendor_id))];
  const ratings = await Promise.all(vendorIds.map((vendorId) => ratingForVendor(vendorId)));
  const ratingByVendorId = new Map(vendorIds.map((vendorId, index) => [vendorId, ratings[index]]));

  const payments = await paymentModel.findByBookingIds(bookings.map((booking) => booking.id));
  const paymentsByBookingId = groupPaymentsByBooking(payments);

  return bookings.map((booking) => {
    const quotation = quotationById.get(booking.quotation_id);
    const request = quotation ? requestById.get(quotation.quotation_request_id) : null;
    const rating = ratingByVendorId.get(booking.vendor_id) || { average: null, total: 0 };
    const paymentSummary = paymentService.buildPaymentSummary(
      quotation ? quotation.grand_total : 0,
      paymentsByBookingId.get(booking.id) || []
    );

    return {
      id: booking.id,
      bookingCode: formatBookingCode(booking.id),
      status: bookingStatusLabel(booking.status, paymentSummary),
      vendorId: booking.vendor_id,
      vendorName: booking.vendors?.company_name || 'Vendor',
      vendorLogo: booking.vendors?.profile_image || null,
      vendorCategory: booking.vendors?.business_category || null,
      eventType: request?.event_type || null,
      eventLocation: request?.event_location || null,
      bookingDate: booking.booking_date,
      grandTotal: quotation ? quotation.grand_total : null,
      ratingAverage: rating.average,
      createdAt: booking.created_at,
    };
  });
}

// Loads one booking + its quotation/event details, checking it belongs to
// this customer, for the booking detail page opened after payment.
async function getBookingDetailForCustomer(customerId, bookingId) {
  const booking = await bookingModel.findByIdForUser(bookingId, customerId);
  if (!booking) {
    throw new AppError(404, 'Booking not found.');
  }

  const [quotation, rating, conversationId, payments] = await Promise.all([
    quotationModel.findById(booking.quotation_id),
    ratingForVendor(booking.vendor_id),
    conversationService.findConversationIdForBooking(booking.id),
    paymentModel.findAllByBookingId(booking.id),
  ]);

  const [request, items, charges] = await Promise.all([
    quotation ? quotationRequestModel.findById(quotation.quotation_request_id) : Promise.resolve(null),
    quotation ? quotationModel.findItemsByQuotationId(quotation.id) : Promise.resolve([]),
    quotation ? quotationModel.findChargesByQuotationId(quotation.id) : Promise.resolve([]),
  ]);

  const paymentSummary = paymentService.buildPaymentSummary(quotation ? quotation.grand_total : 0, payments);

  return {
    id: booking.id,
    bookingCode: formatBookingCode(booking.id),
    status: bookingStatusLabel(booking.status, paymentSummary),
    quotationId: booking.quotation_id,
    conversationId,
    bookingDate: booking.booking_date,
    startTime: booking.start_time,
    endTime: booking.end_time,
    createdAt: booking.created_at,
    vendor: {
      id: booking.vendor_id,
      name: booking.vendors?.company_name || 'Vendor',
      logo: booking.vendors?.profile_image || null,
      category: booking.vendors?.business_category || null,
      address: booking.vendors?.business_address || null,
      memberSince: booking.vendors?.created_at || null,
      ratingAverage: rating.average,
      ratingTotal: rating.total,
    },
    event: {
      eventType: request?.event_type || null,
      location: request?.event_location || null,
      guestsMin: request?.guests_min ?? null,
      guestsMax: request?.guests_max ?? null,
      description: request?.additional_event_description || null,
    },
    items: items.map((item) => ({
      id: item.id,
      serviceName: item.service_name,
      totalPrice: item.total_price,
      description: item.description,
    })),
    charges: charges.map((charge) => ({
      id: charge.id,
      chargeName: charge.charge_name,
      chargePrice: charge.charge_price,
    })),
    grandTotal: quotation ? quotation.grand_total : null,
    payment: {
      depositAmount: paymentSummary.depositAmount,
      balanceAmount: paymentSummary.balanceAmount,
      totalPaid: paymentSummary.totalPaid,
      totalDue: paymentSummary.totalDue,
      deposit: paymentSummary.deposit,
      balance: paymentSummary.balance,
    },
  };
}

// A vendor's own bookings, newest first — same shape used by the customer
// list above, but the counterpart shown is the customer, not the vendor.
async function listVendorBookings(vendorId) {
  const bookings = await bookingModel.listByVendorId(vendorId);
  if (!bookings.length) {
    return [];
  }

  const quotationIds = [...new Set(bookings.map((booking) => booking.quotation_id))];
  const quotations = await quotationModel.findByIds(quotationIds);
  const quotationById = new Map(quotations.map((quotation) => [quotation.id, quotation]));

  const requestIds = [...new Set(quotations.map((quotation) => quotation.quotation_request_id))];
  const requests = await quotationRequestModel.findByIds(requestIds);
  const requestById = new Map(requests.map((request) => [request.id, request]));

  const payments = await paymentModel.findByBookingIds(bookings.map((booking) => booking.id));
  const paymentsByBookingId = groupPaymentsByBooking(payments);

  return bookings.map((booking) => {
    const quotation = quotationById.get(booking.quotation_id);
    const request = quotation ? requestById.get(quotation.quotation_request_id) : null;
    const paymentSummary = paymentService.buildPaymentSummary(
      quotation ? quotation.grand_total : 0,
      paymentsByBookingId.get(booking.id) || []
    );

    return {
      id: booking.id,
      bookingCode: formatBookingCode(booking.id),
      customerName: booking.users?.full_name || 'Customer',
      eventType: request?.event_type || null,
      eventDate: booking.booking_date,
      location: request?.event_location || null,
      guestsMin: request?.guests_min ?? null,
      guestsMax: request?.guests_max ?? null,
      totalAmount: quotation ? quotation.grand_total : null,
      paymentStatus: vendorPaymentStatusLabel(paymentSummary),
      bookingStatus: bookingStatusLabel(booking.status, paymentSummary),
      createdAt: booking.created_at,
    };
  });
}

// Loads one booking + its quotation/event/customer details, checking it
// belongs to this vendor, for the vendor's Booking Details page.
async function getBookingDetailForVendor(vendorId, bookingId) {
  const booking = await bookingModel.findByIdForVendor(bookingId, vendorId);
  if (!booking) {
    throw new AppError(404, 'Booking not found.');
  }

  const [quotation, payments, conversationId] = await Promise.all([
    quotationModel.findById(booking.quotation_id),
    paymentModel.findAllByBookingId(bookingId),
    conversationService.findConversationIdForBooking(booking.id),
  ]);

  const [request, requiredServices] = await Promise.all([
    quotation ? quotationRequestModel.findById(quotation.quotation_request_id) : Promise.resolve(null),
    quotation ? quotationRequestModel.findServicesByRequestId(quotation.quotation_request_id) : Promise.resolve([]),
  ]);

  const paymentSummary = paymentService.buildPaymentSummary(quotation ? quotation.grand_total : 0, payments);

  return {
    id: booking.id,
    bookingCode: formatBookingCode(booking.id),
    bookingStatus: bookingStatusLabel(booking.status, paymentSummary),
    conversationId,
    customerName: booking.users?.full_name || 'Customer',
    customerEmail: booking.users?.email || null,
    customerPhone: booking.users?.phone || null,
    memberSince: booking.users?.created_at || null,
    eventType: request?.event_type || null,
    eventDate: booking.booking_date,
    startTime: booking.start_time,
    endTime: booking.end_time,
    location: request?.event_location || null,
    guestsMin: request?.guests_min ?? null,
    guestsMax: request?.guests_max ?? null,
    budgetMin: request?.budget_min ?? null,
    budgetMax: request?.budget_max ?? null,
    description: request?.additional_event_description || null,
    requiredServices: requiredServices.map((service) => service.service_category),
    servicesTotal: quotation ? quotation.service_subtotal : null,
    additionalCharges: quotation ? quotation.additional_charges : null,
    totalAmount: quotation ? quotation.grand_total : null,
    paymentStatus: vendorPaymentStatusLabel(paymentSummary),
    payment: {
      depositAmount: paymentSummary.depositAmount,
      balanceAmount: paymentSummary.balanceAmount,
      totalPaid: paymentSummary.totalPaid,
      totalDue: paymentSummary.totalDue,
      deposit: paymentSummary.deposit,
      balance: paymentSummary.balance,
    },
    cancellationReason: booking.cancellation_reason || null,
    createdAt: booking.created_at,
  };
}

// Same "build from local date parts" approach the frontend already uses for
// event dates — avoids the UTC-midnight parsing trap of new Date(dateString).
function hasEventEnded(dateString, timeString) {
  if (!dateString || !timeString) return false;
  const [year, month, day] = dateString.split('-').map(Number);
  const [hour, minute, second] = timeString.split(':').map(Number);
  const eventEnd = new Date(year, month - 1, day, hour, minute, second || 0);
  return eventEnd <= new Date();
}

// Vendor marks a confirmed booking as completed — only once the event's end
// time has actually passed, checked here too so the client-side gate can't
// just be bypassed with a raw API call.
async function markBookingCompleted(vendorId, bookingId) {
  const booking = await bookingModel.findByIdForVendor(bookingId, vendorId);
  if (!booking) {
    throw new AppError(404, 'Booking not found.');
  }

  if (booking.status !== 'confirmed') {
    throw new AppError(409, 'Only a confirmed booking can be marked as completed.');
  }

  if (!hasEventEnded(booking.booking_date, booking.end_time)) {
    throw new AppError(409, 'This booking cannot be marked as completed before the event has ended.');
  }

  const paymentSummary = await paymentService.getPaymentSummaryForBooking(bookingId);
  if (!paymentSummary.fullyPaid) {
    throw new AppError(409, 'This booking cannot be marked as completed until it has been paid in full.');
  }

  const updated = await bookingModel.updateStatusForVendor(bookingId, vendorId, 'completed');
  if (!updated) {
    throw new AppError(404, 'Booking not found.');
  }

  return { id: updated.id, bookingStatus: STATUS_LABELS[updated.status] || 'Confirmed' };
}

// Vendor cancels a still-confirmed booking, recording why — cancelling an
// already-completed or already-cancelled booking makes no sense, so both
// are rejected the same way markBookingCompleted rejects a non-confirmed one.
async function cancelBooking(vendorId, bookingId, reason) {
  const booking = await bookingModel.findByIdForVendor(bookingId, vendorId);
  if (!booking) {
    throw new AppError(404, 'Booking not found.');
  }

  if (booking.status !== 'confirmed') {
    throw new AppError(409, 'Only a confirmed booking can be cancelled.');
  }

  const updated = await bookingModel.cancelBookingForVendor(bookingId, vendorId, reason);
  if (!updated) {
    throw new AppError(404, 'Booking not found.');
  }

  return { id: updated.id, bookingStatus: STATUS_LABELS[updated.status] || 'Confirmed' };
}

function toLocalDate(dateString) {
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(year, month - 1, day);
}

// The vendor dashboard's "what's coming up" list — bookings that are still
// active (not completed/cancelled) whose event date hasn't passed yet,
// soonest first. Reuses listVendorBookings rather than re-deriving the
// quotation/request joins it already does.
async function getUpcomingEventsForVendor(vendorId, limit = 5) {
  const bookings = await listVendorBookings(vendorId);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return bookings
    .filter((booking) => booking.bookingStatus !== 'Completed' && booking.bookingStatus !== 'Cancelled')
    .filter((booking) => booking.eventDate && toLocalDate(booking.eventDate) >= today)
    .sort((a, b) => toLocalDate(a.eventDate) - toLocalDate(b.eventDate))
    .slice(0, limit)
    .map((booking) => ({
      id: booking.id,
      customer: booking.customerName,
      event: booking.eventType || 'Event',
      date: booking.eventDate,
      location: booking.location || 'Not specified',
      status: booking.bookingStatus,
    }));
}

// Count of still-active bookings whose event date is exactly tomorrow —
// used by the vendor dashboard's "needs your attention" summary.
async function countBookingsStartingTomorrowForVendor(vendorId) {
  const bookings = await listVendorBookings(vendorId);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  return bookings.filter(
    (booking) =>
      booking.bookingStatus !== 'Completed' &&
      booking.bookingStatus !== 'Cancelled' &&
      booking.eventDate &&
      toLocalDate(booking.eventDate).getTime() === tomorrow.getTime()
  ).length;
}

// Same four labels Booking Management already shows per booking
// (Confirmed/Pending Payment/Completed/Cancelled) — tallied into counts for
// the vendor dashboard's Booking Status donut instead of listed individually,
// via listVendorBookings so the two pages can never disagree on a status.
const BOOKING_STATUS_SUMMARY_ORDER = ['Confirmed', 'Pending Payment', 'Completed', 'Cancelled'];

async function getBookingStatusSummary(vendorId) {
  const bookings = await listVendorBookings(vendorId);
  const counts = { Confirmed: 0, 'Pending Payment': 0, Completed: 0, Cancelled: 0 };

  bookings.forEach((booking) => {
    if (counts[booking.bookingStatus] !== undefined) {
      counts[booking.bookingStatus] += 1;
    }
  });

  return BOOKING_STATUS_SUMMARY_ORDER.map((status) => ({ status, count: counts[status] }));
}

module.exports = {
  listMyBookings,
  getBookingDetailForCustomer,
  listVendorBookings,
  getBookingDetailForVendor,
  markBookingCompleted,
  cancelBooking,
  getUpcomingEventsForVendor,
  countBookingsStartingTomorrowForVendor,
  getBookingStatusSummary,
};
