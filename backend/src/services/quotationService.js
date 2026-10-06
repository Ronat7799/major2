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

function attachRequestedService(items, requestedServiceId) {
  if (!requestedServiceId || !items.length) {
    return items;
  }
  const [first, ...rest] = items;
  return [{ ...first, service_id: requestedServiceId }, ...rest];
}

const INITIAL_QUOTATION_EXPIRY_HOURS = 48;
const REVISION_EXPIRY_HOURS = 24;
// Customers get a single change request per quotation request: once the
// vendor has sent a revised quotation, it can only be accepted or declined.
const MAX_REVISION_NUMBER = 2;

function canRequestChanges(quotation) {
  return (quotation.revision_number || 1) < MAX_REVISION_NUMBER;
}
const DEPOSIT_PAYMENT_HOURS = 24;

function computeExpiresAt(hours) {
  return new Date(Date.now() + hours * 3600000).toISOString();
}

function isExpired(quotation) {
  return (
    (quotation.status === 'pending' || quotation.status === 'revision_requested') &&
    Boolean(quotation.expires_at) &&
    new Date(quotation.expires_at) <= new Date()
  );
}

async function expireOverdueRevisionRequests() {
  const overdue = await quotationModel.findOverdueRevisionRequests();
  if (!overdue.length) {
    return;
  }

  await Promise.all(
    overdue.flatMap((quotation) => [
      quotationModel.updateStatus(quotation.id, 'cancelled'),
      quotationRequestModel.updateStatus(quotation.quotation_request_id, 'declined'),
    ])
  );
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
  const items = attachRequestedService(normalizeItems(payload.items, validServiceIds), request.service_id);
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
    expires_at: computeExpiresAt(INITIAL_QUOTATION_EXPIRY_HOURS),
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

async function listMyQuotations(customerId) {
  await expireOverdueRevisionRequests();

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

async function getQuotationDetailForCustomer(customerId, quotationId) {
  await expireOverdueRevisionRequests();

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

  const invite =
    quotation.status === 'revision_requested' ? await conversationService.findInviteForQuotation(quotation.id) : null;

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
    canRequestChanges: canRequestChanges(quotation),
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

  const booking = await bookingModel.createBooking({
    quotation_id: quotationId,
    vendor_id: quotation.vendor_id,
    user_id: customerId,
    booking_date: request.event_date,
    start_time: request.start_time,
    end_time: request.end_time,
    status: 'confirmed',
    deposit_due_at: computeExpiresAt(DEPOSIT_PAYMENT_HOURS),
  });

  const [updatedQuotation] = await Promise.all([
    quotationModel.updateStatus(quotationId, 'accepted'),
    quotationRequestModel.updateStatus(request.id, 'accepted'),
  ]);

  const conversation = await conversationService.ensureConversationForBooking(booking);

  return { id: updatedQuotation.id, status: updatedQuotation.status, conversationId: conversation.id };
}

async function requestRevision(customerId, quotationId, note) {
  const { quotation } = await loadOwnedQuotation(customerId, quotationId);

  if (quotation.status !== 'pending') {
    throw new AppError(409, 'Changes can only be requested for a quotation awaiting your response.');
  }

  if (isExpired(quotation)) {
    throw new AppError(409, 'This quotation has expired.');
  }

  if (!canRequestChanges(quotation)) {
    throw new AppError(409, 'You have already requested changes once. Please accept or decline this revised quotation.');
  }

  const updated = await quotationModel.markRevisionRequested(quotationId, note, computeExpiresAt(REVISION_EXPIRY_HOURS));
  return { id: updated.id, status: updated.status, revisionNote: updated.revision_note };
}

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

  if (isExpired(oldQuotation)) {
    await Promise.all([
      quotationModel.updateStatus(oldQuotation.id, 'cancelled'),
      quotationRequestModel.updateStatus(oldQuotation.quotation_request_id, 'declined'),
    ]);
    throw new AppError(409, 'The deadline to respond to this revision request has passed, and it was automatically declined.');
  }

  const originatingRequest = await quotationRequestModel.findById(oldQuotation.quotation_request_id);
  const validServiceIds = await loadValidServiceIds(vendorId);
  const items = attachRequestedService(normalizeItems(payload.items, validServiceIds), originatingRequest?.service_id);
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
    expires_at: computeExpiresAt(REVISION_EXPIRY_HOURS),
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
  expireOverdueRevisionRequests,
};
