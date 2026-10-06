const AppError = require('../utils/AppError');
const vendorModel = require('../models/vendorModel');
const quotationRequestModel = require('../models/quotationRequestModel');
const quotationModel = require('../models/quotationModel');
const serviceModel = require('../models/serviceModel');
const storageService = require('./storageService');
const quotationService = require('./quotationService');

const MAX_INSPIRATION_IMAGES = 5;

const STATUS_LABELS = {
  pending: 'NEW',
  quoted: 'PENDING',
  accepted: 'ACCEPTED',
  declined: 'DECLINED',
  cancelled: 'CANCELLED',
};

function toNullableNumber(value) {
  return value === '' || value === null || value === undefined ? null : Number(value);
}

function toTimeColumn(value) {
  if (!value) {
    return null;
  }
  const match = /^(\d{1,2}):(\d{2})\s*(AM|PM)$/i.exec(String(value).trim());
  if (!match) {
    return null;
  }
  const [, hourStr, minute, period] = match;
  let hour = parseInt(hourStr, 10) % 12;
  if (period.toUpperCase() === 'PM') {
    hour += 12;
  }
  return `${String(hour).padStart(2, '0')}:${minute}:00`;
}

function toStringArray(value) {
  if (value === undefined || value === null || value === '') {
    return [];
  }
  return Array.isArray(value) ? value : [value];
}

async function resolveVendorId(userId, vendorIdHint) {
  if (vendorIdHint) {
    return vendorIdHint;
  }
  const vendor = await vendorModel.findByUserId(userId);
  return vendor ? vendor.id : null;
}

const MIN_EVENT_LEAD_DAYS = 3;

function isEventDateFarEnoughOut(eventDateString) {
  const [year, month, day] = eventDateString.split('-').map(Number);
  const eventDate = new Date(year, month - 1, day);
  const earliestAllowed = new Date();
  earliestAllowed.setHours(0, 0, 0, 0);
  earliestAllowed.setDate(earliestAllowed.getDate() + MIN_EVENT_LEAD_DAYS);
  return eventDate >= earliestAllowed;
}

async function resolveRequestedServiceId(serviceId, vendorId) {
  if (!serviceId) {
    return null;
  }
  const service = await serviceModel.findById(serviceId);
  return service && service.vendor_id === vendorId ? service.id : null;
}

async function submitRequest(customerId, payload, files = []) {
  const vendor = await vendorModel.findById(payload.vendor_id);
  if (!vendor || !vendor.company_name) {
    throw new AppError(404, 'Vendor not found.');
  }

  if (payload.event_date && !isEventDateFarEnoughOut(payload.event_date)) {
    throw new AppError(400, `Event date must be at least ${MIN_EVENT_LEAD_DAYS} days from today.`);
  }

  const serviceId = await resolveRequestedServiceId(payload.service_id, payload.vendor_id);

  const request = await quotationRequestModel.createRequest({
    customer_id: customerId,
    vendor_id: payload.vendor_id,
    service_id: serviceId,
    event_type: payload.event_type,
    event_date: payload.event_date || null,
    start_time: toTimeColumn(payload.start_time),
    end_time: toTimeColumn(payload.end_time),
    event_location: payload.event_location ? payload.event_location.trim() : null,
    guests_min: toNullableNumber(payload.guests_min),
    guests_max: toNullableNumber(payload.guests_max),
    budget_min: toNullableNumber(payload.budget_min),
    budget_max: toNullableNumber(payload.budget_max),
    additional_event_description: payload.additional_event_description
      ? payload.additional_event_description.trim()
      : null,
  });

  const categories = toStringArray(payload.service_categories).filter(Boolean);
  if (categories.length) {
    await quotationRequestModel.createRequestServices(request.id, categories);
  }

  if (files.length) {
    const imageUrls = await Promise.all(
      files
        .slice(0, MAX_INSPIRATION_IMAGES)
        .map((file) => storageService.uploadQuotationRequestImage(customerId, request.id, file))
    );
    await quotationRequestModel.createRequestImages(request.id, imageUrls);
  }

  return request;
}

function formatRangeLabel(min, max, prefix = '') {
  const hasMin = min !== null && min !== undefined;
  const hasMax = max !== null && max !== undefined;
  if (!hasMin && !hasMax) {
    return null;
  }
  if (hasMin && hasMax && Number(min) !== Number(max)) {
    return `${prefix}${Number(min).toLocaleString('en-US')} - ${prefix}${Number(max).toLocaleString('en-US')}`;
  }
  const value = hasMin ? min : max;
  return `${prefix}${Number(value).toLocaleString('en-US')}`;
}

function latestQuotationByRequestId(quotations) {
  const map = new Map();
  for (const quotation of quotations) {
    const current = map.get(quotation.quotation_request_id);
    if (!current || (quotation.revision_number || 0) > (current.revision_number || 0)) {
      map.set(quotation.quotation_request_id, quotation);
    }
  }
  return map;
}

async function listVendorRequests(userId, vendorIdHint) {
  await quotationService.expireOverdueRevisionRequests();

  const vendorId = await resolveVendorId(userId, vendorIdHint);
  if (!vendorId) {
    return [];
  }

  const rows = await quotationRequestModel.listByVendorId(vendorId);
  if (!rows.length) {
    return [];
  }

  const quotations = await quotationModel.findByRequestIds(rows.map((row) => row.id));
  const latestByRequestId = latestQuotationByRequestId(quotations);

  return rows.map((row) => {
    const latestQuotation = latestByRequestId.get(row.id);
    const needsRevision = latestQuotation?.status === 'revision_requested';

    return {
      id: row.id,
      customerName: row.users?.full_name || 'Unknown Customer',
      submittedDate: row.created_at,
      eventTitle: row.event_type || 'Event',
      eventCategory: row.event_type,
      eventDate: row.event_date,
      location: row.event_location || 'Not specified',
      budgetLabel: formatRangeLabel(row.budget_min, row.budget_max, '$') || 'Not specified',
      budgetSort: row.budget_max ?? row.budget_min ?? 0,
      guestsLabel: formatRangeLabel(row.guests_min, row.guests_max) || 'Not specified',
      status: needsRevision ? 'REVISION REQUESTED' : STATUS_LABELS[row.status] || row.status.toUpperCase(),
    };
  });
}

function formatRequestCode(id) {
  return `REQ-${id.replace(/-/g, '').slice(0, 8).toUpperCase()}`;
}

async function getVendorRequestDetail(userId, vendorIdHint, requestId) {
  await quotationService.expireOverdueRevisionRequests();

  const vendorId = await resolveVendorId(userId, vendorIdHint);
  if (!vendorId) {
    throw new AppError(404, 'Quotation request not found.');
  }

  const row = await quotationRequestModel.findByIdForVendor(requestId, vendorId);
  if (!row) {
    throw new AppError(404, 'Quotation request not found.');
  }

  const [services, images, latestQuotation, requestedService] = await Promise.all([
    quotationRequestModel.findServicesByRequestId(requestId),
    quotationRequestModel.findImagesByRequestId(requestId),
    quotationModel.findByRequestId(requestId),
    row.service_id ? serviceModel.findById(row.service_id) : Promise.resolve(null),
  ]);

  const [latestQuotationItems, latestQuotationCharges] =
    latestQuotation && latestQuotation.status === 'revision_requested'
      ? await Promise.all([
          quotationModel.findItemsByQuotationId(latestQuotation.id),
          quotationModel.findChargesByQuotationId(latestQuotation.id),
        ])
      : [[], []];

  return {
    id: row.id,
    requestCode: formatRequestCode(row.id),
    status: STATUS_LABELS[row.status] || row.status.toUpperCase(),
    submittedDate: row.created_at,
    eventType: row.event_type,
    eventDate: row.event_date,
    startTime: row.start_time,
    endTime: row.end_time,
    location: row.event_location,
    guestsMin: row.guests_min,
    guestsMax: row.guests_max,
    budgetMin: row.budget_min,
    budgetMax: row.budget_max,
    description: row.additional_event_description,
    requestedService: requestedService
      ? { id: requestedService.id, serviceName: requestedService.service_name, category: requestedService.service_category }
      : null,
    services: services.map((service) => service.service_category),
    images: images.map((image) => ({ id: image.id, image_url: image.image_url })),
    latestQuotation: latestQuotation
      ? {
          id: latestQuotation.id,
          status: latestQuotation.status,
          revisionNumber: latestQuotation.revision_number,
          revisionNote: latestQuotation.revision_note,
          grandTotal: latestQuotation.grand_total,
          serviceMessage: latestQuotation.service_message,
          items: latestQuotationItems.map((item) => ({
            service_id: item.service_id,
            service_name: item.service_name,
            quantity: item.quantity,
            unit_price: item.unit_price,
            description: item.description,
          })),
          charges: latestQuotationCharges.map((charge) => ({
            charge_name: charge.charge_name,
            charge_price: charge.charge_price,
          })),
        }
      : null,
    customer: {
      name: row.users?.full_name || 'Unknown Customer',
      email: row.users?.email || null,
      phone: row.users?.phone || null,
      memberSince: row.users?.created_at || null,
    },
  };
}

async function declineRequest(userId, vendorIdHint, requestId) {
  const vendorId = await resolveVendorId(userId, vendorIdHint);
  if (!vendorId) {
    throw new AppError(404, 'Quotation request not found.');
  }

  const request = await quotationRequestModel.findByIdForVendor(requestId, vendorId);
  if (!request) {
    throw new AppError(404, 'Quotation request not found.');
  }

  if (request.status !== 'pending') {
    throw new AppError(409, 'Only a new request can be declined.');
  }

  const updated = await quotationRequestModel.updateStatus(requestId, 'declined');
  return { id: updated.id, status: STATUS_LABELS[updated.status] || updated.status.toUpperCase() };
}

async function cancelRequest(customerId, requestId) {
  const request = await quotationRequestModel.findById(requestId);
  if (!request || request.customer_id !== customerId) {
    throw new AppError(404, 'Quotation request not found.');
  }

  if (request.status !== 'pending') {
    throw new AppError(409, 'This request can no longer be withdrawn.');
  }

  const updated = await quotationRequestModel.updateStatus(requestId, 'cancelled');
  return { id: updated.id, status: STATUS_LABELS[updated.status] || updated.status.toUpperCase() };
}

module.exports = {
  MAX_INSPIRATION_IMAGES,
  submitRequest,
  listVendorRequests,
  getVendorRequestDetail,
  declineRequest,
  cancelRequest,
};
