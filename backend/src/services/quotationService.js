const AppError = require('../utils/AppError');
const vendorModel = require('../models/vendorModel');
const quotationRequestModel = require('../models/quotationRequestModel');
const quotationModel = require('../models/quotationModel');
const reviewModel = require('../models/reviewModel');
const bookingModel = require('../models/bookingModel');
const serviceModel = require('../models/serviceModel');
const conversationService = require('./conversationService');
const paymentService = require('./paymentService');

async function loadValidServiceIds(vendorId) {
  const { services } = await serviceModel.listByVendorId(vendorId, { page: 1, pageSize: 500 });
  return new Set(services.map((service) => service.id));
}

// How long a customer has to accept/decline/request changes on a quotation
// before it auto-expires. Real, server-enforced, and stored in expires_at —
// unlike the old purely cosmetic countdown the frontend used to fake.
const QUOTATION_EXPIRY_HOURS = 48;

function computeExpiresAt() {
  return new Date(Date.now() + QUOTATION_EXPIRY_HOURS * 3600000).toISOString();
}

// A quotation is only actually "pending" if it hasn't passed its own
// expires_at — used by every action a customer can take on a quotation
// (accept/decline/request changes) so the check can never be bypassed by
// calling the API directly regardless of what the UI shows.
function isExpired(quotation) {
  return quotation.status === 'pending' && Boolean(quotation.expires_at) && new Date(quotation.expires_at) <= new Date();
}

async function resolveVendorId(userId, vendorIdHint) {
  if (vendorIdHint) {
    return vendorIdHint;
  }
  const vendor = await vendorModel.findByUserId(userId);
  return vendor ? vendor.id : null;
}

function toNullableNumber(value) {
  return value === '' || value === null || value === undefined ? null : Number(value);
}

// validServiceIds scopes service_id to the vendor's own catalog — a vendor
// can only link a line item to a service they actually own, and anything
// else (including a plain custom/free-text item) silently stays unlinked
// rather than erroring out the whole quotation.
function normalizeItems(rawItems, validServiceIds = null) {
  const items = Array.isArray(rawItems) ? rawItems : [];

  return items
    .map((item) => ({
      service_id: validServiceIds && validServiceIds.has(item.service_id) ? item.service_id : null,
      service_name: String(item.service_name || '').trim(),
      quantity: toNullableNumber(item.quantity),
      unit_price: toNullableNumber(item.unit_price),
      description: item.description ? String(item.description).trim() : null,
    }))
    .filter((item) => item.service_name && item.quantity > 0 && item.unit_price !== null && item.unit_price >= 0)
    .map((item) => ({
      ...item,
      total_price: Number((item.quantity * item.unit_price).toFixed(2)),
    }));
}

function normalizeCharges(rawCharges) {
  const charges = Array.isArray(rawCharges) ? rawCharges : [];

  return charges
    .map((charge) => ({
      charge_name: String(charge.charge_name || '').trim(),
      charge_price: toNullableNumber(charge.charge_price),
    }))
    .filter((charge) => charge.charge_name && charge.charge_price > 0);
}

async function createQuotationForRequest(userId, vendorIdHint, requestId, payload) {
  const vendorId = await resolveVendorId(userId, vendorIdHint);
  if (!vendorId) {
    throw new AppError(404, 'Quotation request not found.');
  }

  const request = await quotationRequestModel.findByIdForVendor(requestId, vendorId);
  if (!request) {
    throw new AppError(404, 'Quotation request not found.');
  }

  if (request.status !== 'pending') {
    throw new AppError(409, 'A quotation has already been sent for this request.');
  }

  const validServiceIds = await loadValidServiceIds(vendorId);
  const items = normalizeItems(payload.items, validServiceIds);
  if (!items.length) {
    throw new AppError(400, 'Add at least one service with a name, quantity, and unit price.');
  }

  const charges = normalizeCharges(payload.charges);

  const serviceSubtotal = Number(items.reduce((sum, item) => sum + item.total_price, 0).toFixed(2));
  const additionalChargesTotal = Number(charges.reduce((sum, charge) => sum + charge.charge_price, 0).toFixed(2));
  const platformFee = 0;
  const grandTotal = Number((serviceSubtotal + additionalChargesTotal + platformFee).toFixed(2));

  const quotation = await quotationModel.createQuotation({
    quotation_request_id: requestId,
    vendor_id: vendorId,
    service_subtotal: serviceSubtotal,
    additional_charges: additionalChargesTotal,
    platform_fee: platformFee,
    grand_total: grandTotal,
    service_message: payload.service_message ? String(payload.service_message).trim() : null,
    status: 'pending',
    expires_at: computeExpiresAt(),
  });

  await Promise.all([
    quotationModel.createQuotationItems(quotation.id, items),
    charges.length ? quotationModel.createAdditionalCharges(quotation.id, charges) : Promise.resolve(),
    quotationRequestModel.updateStatus(requestId, 'quoted'),
  ]);

  return {
    id: quotation.id,
    quotationRequestId: quotation.quotation_request_id,
    serviceSubtotal: quotation.service_subtotal,
    additionalCharges: quotation.additional_charges,
    platformFee: quotation.platform_fee,
    grandTotal: quotation.grand_total,
    serviceMessage: quotation.service_message,
    status: quotation.status,
  };
}

// Keeps only the newest quotation per request (by revision_number) — a
// revision chain must show as one card, not one per historical version.
function latestPerRequest(quotations) {
  const latestByRequestId = new Map();
  for (const quotation of quotations) {
    const current = latestByRequestId.get(quotation.quotation_request_id);
    if (!current || quotation.revision_number > current.revision_number) {
      latestByRequestId.set(quotation.quotation_request_id, quotation);
    }
  }
  return [...latestByRequestId.values()];
}

// A customer's own requests, newest first — one row per request. A request
// that already has a quotation shows its latest revision; a request still
// awaiting a vendor's response (no quotation yet) shows as its own
// "hasQuotation: false" item instead of being omitted, so the customer can
// see — and cancel — something they're still waiting on.
async function listMyQuotations(customerId) {
  const requests = await quotationRequestModel.listByCustomerId(customerId);
  if (!requests.length) {
    return [];
  }

  const allQuotations = await quotationModel.findByRequestIds(requests.map((request) => request.id));
  const quotations = latestPerRequest(allQuotations);
  const quotedRequestIds = new Set(quotations.map((quotation) => quotation.quotation_request_id));

  const requestById = new Map(requests.map((request) => [request.id, request]));

  const vendorIds = [...new Set(requests.map((request) => request.vendor_id))];
  const ratings = await Promise.all(vendorIds.map((vendorId) => ratingForVendor(vendorId)));
  const ratingByVendorId = new Map(vendorIds.map((vendorId, index) => [vendorId, ratings[index]]));

  const quotedItems = quotations
    .map((quotation) => {
      const request = requestById.get(quotation.quotation_request_id);
      if (!request) {
        return null;
      }
      const rating = ratingByVendorId.get(quotation.vendor_id) || { average: null, total: 0 };

      return {
        id: quotation.id,
        hasQuotation: true,
        quotationRequestId: request.id,
        vendorId: quotation.vendor_id,
        vendorName: request.vendors?.company_name || 'Vendor',
        vendorLogo: request.vendors?.profile_image || null,
        eventCategory: request.event_type,
        grandTotal: quotation.grand_total,
        status: quotation.status,
        submittedDate: quotation.created_at,
        expiresAt: quotation.expires_at,
        isExpired: isExpired(quotation),
        ratingAverage: rating.average,
        ratingTotal: rating.total,
      };
    })
    .filter(Boolean);

  // Distinct from the quoted-item status vocabulary below — a raw 'pending'
  // here means "waiting on the vendor to quote", not "waiting on the
  // customer to respond to a quotation", so it needs its own label rather
  // than sharing the same word with a different meaning.
  const UNQUOTED_STATUS_LABELS = {
    pending: 'Awaiting Response',
    declined: 'Declined',
    cancelled: 'Cancelled',
  };

  const unquotedItems = requests
    .filter((request) => !quotedRequestIds.has(request.id))
    .map((request) => {
      const rating = ratingByVendorId.get(request.vendor_id) || { average: null, total: 0 };

      return {
        id: null,
        hasQuotation: false,
        quotationRequestId: request.id,
        vendorId: request.vendor_id,
        vendorName: request.vendors?.company_name || 'Vendor',
        vendorLogo: request.vendors?.profile_image || null,
        eventCategory: request.event_type,
        grandTotal: null,
        status: request.status,
        statusLabel: UNQUOTED_STATUS_LABELS[request.status] || 'Awaiting Response',
        submittedDate: request.created_at,
        expiresAt: null,
        isExpired: false,
        ratingAverage: rating.average,
        ratingTotal: rating.total,
      };
    });

  return [...quotedItems, ...unquotedItems].sort((a, b) => new Date(b.submittedDate) - new Date(a.submittedDate));
}

async function ratingForVendor(vendorId) {
  const reviews = await reviewModel.findByVendorId(vendorId);
  const total = reviews.length;
  const average = total ? Number((reviews.reduce((sum, review) => sum + review.rating, 0) / total).toFixed(1)) : null;
  return { average, total };
}

// Loads a quotation + its request and checks the request belongs to this
// customer, throwing 404 either way so a mismatched owner can't tell a
// missing quotation apart from someone else's.
async function loadOwnedQuotation(customerId, quotationId) {
  const quotation = await quotationModel.findById(quotationId);
  if (!quotation) {
    throw new AppError(404, 'Quotation not found.');
  }

  const request = await quotationRequestModel.findById(quotation.quotation_request_id);
  if (!request || request.customer_id !== customerId) {
    throw new AppError(404, 'Quotation not found.');
  }

  return { quotation, request };
}

function formatQuotationCode(id) {
  return `QT-${id.replace(/-/g, '').slice(0, 8).toUpperCase()}`;
}

// Full breakdown of one quotation for the customer who received it — the
// request must belong to them, regardless of which vendor sent the quote.
async function getQuotationDetailForCustomer(customerId, quotationId) {
  const { quotation, request } = await loadOwnedQuotation(customerId, quotationId);

  const [items, charges, services, rating, vendor, completedEvents, booking, chain] = await Promise.all([
    quotationModel.findItemsByQuotationId(quotation.id),
    quotationModel.findChargesByQuotationId(quotation.id),
    quotationRequestModel.findServicesByRequestId(request.id),
    ratingForVendor(quotation.vendor_id),
    vendorModel.findById(quotation.vendor_id),
    bookingModel.countCompletedByVendorId(quotation.vendor_id),
    quotation.status === 'accepted' ? bookingModel.findByQuotationId(quotation.id) : Promise.resolve(null),
    quotationModel.findChainByRequestId(request.id),
  ]);

  const [conversationId, paymentSummary] = await Promise.all([
    booking ? conversationService.findConversationIdForBooking(booking.id) : Promise.resolve(null),
    booking ? paymentService.getPaymentSummaryForBooking(booking.id) : Promise.resolve(null),
  ]);

  // A vendor-sent chat invite only ever exists pre-booking, while the
  // customer's revision request is still pending — kept separate from
  // conversationId above, which stays booking-only as it always has.
  const invite =
    quotation.status === 'revision_requested' ? await conversationService.findInviteForQuotation(quotation.id) : null;

  // The revision that replaced this one, if any — lets the UI link forward
  // from a superseded ("revised") quotation to its newer version.
  const nextRevision = chain.find((entry) => entry.parent_quotation_id === quotation.id) || null;

  return {
    id: quotation.id,
    quotationCode: formatQuotationCode(quotation.id),
    quotationRequestId: request.id,
    status: quotation.status,
    conversationId,
    inviteConversationId: invite ? invite.id : null,
    inviteStatus: invite ? invite.status : null,
    bookingId: booking ? booking.id : null,
    payment: paymentSummary
      ? {
          depositAmount: paymentSummary.depositAmount,
          balanceAmount: paymentSummary.balanceAmount,
          totalPaid: paymentSummary.totalPaid,
          totalDue: paymentSummary.totalDue,
          deposit: paymentSummary.deposit,
          balance: paymentSummary.balance,
        }
      : null,
    revisionNumber: quotation.revision_number,
    revisionNote: quotation.revision_note,
    parentQuotationId: quotation.parent_quotation_id,
    revisedAt: quotation.revised_at,
    expiresAt: quotation.expires_at,
    isExpired: isExpired(quotation),
    nextQuotationId: nextRevision ? nextRevision.id : null,
    history: chain.map((entry) => ({
      id: entry.id,
      revisionNumber: entry.revision_number,
      status: entry.status,
      grandTotal: entry.grand_total,
      revisionNote: entry.revision_note,
      createdAt: entry.created_at,
      isCurrent: entry.id === quotation.id,
    })),
    submittedDate: quotation.created_at,
    serviceSubtotal: quotation.service_subtotal,
    additionalCharges: quotation.additional_charges,
    platformFee: quotation.platform_fee,
    grandTotal: quotation.grand_total,
    serviceMessage: quotation.service_message,
    items: items.map((item) => ({
      id: item.id,
      serviceId: item.service_id,
      serviceName: item.service_name,
      quantity: item.quantity,
      unitPrice: item.unit_price,
      totalPrice: item.total_price,
      description: item.description,
    })),
    charges: charges.map((charge) => ({
      id: charge.id,
      chargeName: charge.charge_name,
      chargePrice: charge.charge_price,
    })),
    event: {
      eventType: request.event_type,
      eventDate: request.event_date,
      startTime: request.start_time,
      endTime: request.end_time,
      location: request.event_location,
      guestsMin: request.guests_min,
      guestsMax: request.guests_max,
      budgetMin: request.budget_min,
      budgetMax: request.budget_max,
      description: request.additional_event_description,
      requiredServices: services.map((service) => service.service_category),
    },
    vendor: {
      id: quotation.vendor_id,
      name: request.vendors?.company_name || 'Vendor',
      logo: request.vendors?.profile_image || null,
      address: request.vendors?.business_address || null,
      category: vendor?.business_category || null,
      memberSince: vendor?.created_at || null,
      completedEvents,
      ratingAverage: rating.average,
      ratingTotal: rating.total,
    },
  };
}

function timeToMinutes(timeString) {
  if (!timeString) return null;
  const [hour, minute] = timeString.split(':').map(Number);
  return hour * 60 + minute;
}

// Same-day ranges overlap when each starts before the other ends. Missing
// start/end time on either side is treated as an all-day commitment, since
// there's no safe way to assume no overlap without knowing the hours.
function bookingsConflict(dateA, startA, endA, dateB, startB, endB) {
  if (dateA !== dateB) return false;
  const startAMin = timeToMinutes(startA);
  const endAMin = timeToMinutes(endA);
  const startBMin = timeToMinutes(startB);
  const endBMin = timeToMinutes(endB);
  if (startAMin === null || endAMin === null || startBMin === null || endBMin === null) {
    return true;
  }
  return startAMin < endBMin && startBMin < endAMin;
}

// Backstop for the "already booked" calendar the customer sees when
// requesting a quote — that only blocks whole days at the point of
// submission, so this re-checks with real time-overlap precision at the
// moment a booking is actually about to be created, in case another
// acceptance took the slot in between (or the request predates that
// calendar feature).
async function assertVendorAvailable(vendorId, eventDate, startTime, endTime) {
  if (!eventDate) return;
  const existingSchedule = await bookingModel.findConfirmedScheduleByVendorId(vendorId);
  const hasConflict = existingSchedule.some((booking) =>
    bookingsConflict(eventDate, startTime, endTime, booking.booking_date, booking.start_time, booking.end_time)
  );
  if (hasConflict) {
    throw new AppError(409, 'This vendor already has a confirmed booking during this date and time.');
  }
}

async function acceptQuotation(customerId, quotationId) {
  const { quotation, request } = await loadOwnedQuotation(customerId, quotationId);

  if (quotation.status !== 'pending') {
    throw new AppError(409, 'This quotation has already been responded to.');
  }

  if (isExpired(quotation)) {
    throw new AppError(409, 'This quotation has expired.');
  }

  await assertVendorAvailable(quotation.vendor_id, request.event_date, request.start_time, request.end_time);

  const [updatedQuotation, , booking] = await Promise.all([
    quotationModel.updateStatus(quotationId, 'accepted'),
    quotationRequestModel.updateStatus(request.id, 'accepted'),
    bookingModel.createBooking({
      quotation_id: quotationId,
      vendor_id: quotation.vendor_id,
      user_id: customerId,
      booking_date: request.event_date,
      start_time: request.start_time,
      end_time: request.end_time,
      status: 'confirmed',
    }),
  ]);

  const conversation = await conversationService.ensureConversationForBooking(booking);

  return { id: updatedQuotation.id, status: updatedQuotation.status, conversationId: conversation.id };
}

// Customer asks the vendor for changes before accepting. Only a freshly sent
// (still 'pending') quotation is eligible — once accepted a booking already
// exists, and this flow is scoped to before payment/acceptance.
async function requestRevision(customerId, quotationId, note) {
  const { quotation } = await loadOwnedQuotation(customerId, quotationId);

  if (quotation.status !== 'pending') {
    throw new AppError(409, 'Changes can only be requested for a quotation awaiting your response.');
  }

  if (isExpired(quotation)) {
    throw new AppError(409, 'This quotation has expired.');
  }

  const updated = await quotationModel.markRevisionRequested(quotationId, note);
  return { id: updated.id, status: updated.status, revisionNote: updated.revision_note };
}

// Vendor sends a new quotation for the same request instead of overwriting
// the old one — the old row is kept, marked 'revised', and linked via
// parent_quotation_id so the full history stays intact.
async function createRevisionForQuotation(userId, vendorIdHint, quotationId, payload) {
  const vendorId = await resolveVendorId(userId, vendorIdHint);
  if (!vendorId) {
    throw new AppError(404, 'Quotation not found.');
  }

  const oldQuotation = await quotationModel.findById(quotationId);
  if (!oldQuotation || oldQuotation.vendor_id !== vendorId) {
    throw new AppError(404, 'Quotation not found.');
  }

  if (oldQuotation.status !== 'revision_requested') {
    throw new AppError(409, 'This quotation is not awaiting a revision.');
  }

  const validServiceIds = await loadValidServiceIds(vendorId);
  const items = normalizeItems(payload.items, validServiceIds);
  if (!items.length) {
    throw new AppError(400, 'Add at least one service with a name, quantity, and unit price.');
  }

  const charges = normalizeCharges(payload.charges);

  const serviceSubtotal = Number(items.reduce((sum, item) => sum + item.total_price, 0).toFixed(2));
  const additionalChargesTotal = Number(charges.reduce((sum, charge) => sum + charge.charge_price, 0).toFixed(2));
  const platformFee = 0;
  const grandTotal = Number((serviceSubtotal + additionalChargesTotal + platformFee).toFixed(2));

  const revision = await quotationModel.createQuotation({
    quotation_request_id: oldQuotation.quotation_request_id,
    vendor_id: vendorId,
    service_subtotal: serviceSubtotal,
    additional_charges: additionalChargesTotal,
    platform_fee: platformFee,
    grand_total: grandTotal,
    service_message: payload.service_message ? String(payload.service_message).trim() : null,
    status: 'pending',
    expires_at: computeExpiresAt(),
    parent_quotation_id: oldQuotation.id,
    revision_number: (oldQuotation.revision_number || 1) + 1,
  });

  await Promise.all([
    quotationModel.createQuotationItems(revision.id, items),
    charges.length ? quotationModel.createAdditionalCharges(revision.id, charges) : Promise.resolve(),
    quotationModel.markRevised(oldQuotation.id),
  ]);

  return {
    id: revision.id,
    quotationRequestId: revision.quotation_request_id,
    revisionNumber: revision.revision_number,
    grandTotal: revision.grand_total,
    status: revision.status,
  };
}

// Vendor sends (or re-sends) a chat invite for a quotation the customer
// asked to revise — lets the vendor ask a clarifying question before
// committing to a full revision. Only available in that one narrow window;
// the customer must accept before real messaging works (see
// conversationService.sendMessage's status gate).
async function createChatInviteForQuotation(userId, vendorIdHint, quotationId) {
  const vendorId = await resolveVendorId(userId, vendorIdHint);
  if (!vendorId) {
    throw new AppError(404, 'Quotation not found.');
  }

  const quotation = await quotationModel.findById(quotationId);
  if (!quotation || quotation.vendor_id !== vendorId) {
    throw new AppError(404, 'Quotation not found.');
  }

  if (quotation.status !== 'revision_requested') {
    throw new AppError(409, 'You can only start a chat after the customer requests changes.');
  }

  const request = await quotationRequestModel.findById(quotation.quotation_request_id);
  if (!request) {
    throw new AppError(404, 'Quotation request not found.');
  }

  const conversation = await conversationService.createInviteForQuotation({
    quotationId: quotation.id,
    vendorId,
    customerId: request.customer_id,
  });

  return { conversationId: conversation.id };
}

async function declineQuotation(customerId, quotationId) {
  const { quotation, request } = await loadOwnedQuotation(customerId, quotationId);

  if (quotation.status !== 'pending') {
    throw new AppError(409, 'This quotation has already been responded to.');
  }

  if (isExpired(quotation)) {
    throw new AppError(409, 'This quotation has expired.');
  }

  const [updatedQuotation] = await Promise.all([
    quotationModel.updateStatus(quotationId, 'cancelled'),
    quotationRequestModel.updateStatus(request.id, 'declined'),
  ]);

  return { id: updatedQuotation.id, status: updatedQuotation.status };
}

module.exports = {
  createQuotationForRequest,
  listMyQuotations,
  getQuotationDetailForCustomer,
  acceptQuotation,
  declineQuotation,
  requestRevision,
  createRevisionForQuotation,
  createChatInviteForQuotation,
};
