const AppError = require('../utils/AppError');
const vendorModel = require('../models/vendorModel');
const serviceModel = require('../models/serviceModel');
const portfolioModel = require('../models/portfolioModel');
const bookingModel = require('../models/bookingModel');
const quotationModel = require('../models/quotationModel');
const storageService = require('./storageService');
const { toServiceView } = require('../utils/serviceView');
const { PLATFORM_COMMISSION_RATE } = require('../config/paymentConfig');

function toNullableInt(value) {
  return value === '' || value === null || value === undefined ? null : Number(value);
}

function toServiceFields(payload) {
  const {
    service_name,
    service_category,
    starting_price,
    minimum_guest_capacity,
    maximum_guest_capacity,
    estimated_setup_time,
    service_description,
    availability,
  } = payload;

  return {
    service_name: service_name.trim(),
    service_category: service_category.trim(),
    starting_price: Number(starting_price),
    minimum_guest_capacity: toNullableInt(minimum_guest_capacity),
    maximum_guest_capacity: toNullableInt(maximum_guest_capacity),
    estimated_setup_time: estimated_setup_time ? estimated_setup_time.trim() : null,
    service_description: service_description ? service_description.trim() : null,
    availability: availability === 'Inactive' ? 'Inactive' : 'Active',
  };
}

const MAX_SERVICE_IMAGES = 12;

// vendorIdHint comes from the JWT (set at login/register) so most requests skip
// this lookup entirely; only tokens issued before that change fall back to a query.
async function resolveVendorId(userId, vendorIdHint) {
  if (vendorIdHint) {
    return vendorIdHint;
  }
  const vendor = await vendorModel.findByUserId(userId);
  return vendor ? vendor.id : null;
}

function toIdArray(value) {
  if (value === undefined || value === null || value === '') {
    return [];
  }
  return Array.isArray(value) ? value : [value];
}

async function uploadNewImages(vendorId, serviceId, files) {
  return Promise.all(
    files.map(async (file) => {
      const imageUrl = await storageService.uploadServiceImage(vendorId, serviceId, file);
      const row = await portfolioModel.createImage({ service_id: serviceId, image_url: imageUrl });
      return { id: row.id, image_url: row.image_url };
    })
  );
}

async function createService(userId, vendorIdHint, payload, files = []) {
  const vendorId = await resolveVendorId(userId, vendorIdHint);
  if (!vendorId) {
    throw new AppError(400, 'Complete your vendor profile before adding services.');
  }

  const service = await serviceModel.createService({
    vendor_id: vendorId,
    ...toServiceFields(payload),
  });

  const images = await uploadNewImages(vendorId, service.id, files);

  return toServiceView(service, images);
}

const SERVICE_PAGE_SIZE = 6;

function toListOptions(filters = {}) {
  const page = Math.max(1, parseInt(filters.page, 10) || 1);

  return {
    search: filters.search ? String(filters.search).trim() : '',
    category: filters.category ? String(filters.category).trim() : '',
    status: ['Active', 'Inactive'].includes(filters.status) ? filters.status : '',
    sort: filters.sort,
    page,
    pageSize: SERVICE_PAGE_SIZE,
  };
}

async function listMyServices(userId, vendorIdHint, filters = {}) {
  const options = toListOptions(filters);
  const emptyResult = {
    services: [],
    pagination: { page: options.page, pageSize: options.pageSize, total: 0, totalPages: 0 },
  };

  const vendorId = await resolveVendorId(userId, vendorIdHint);
  if (!vendorId) {
    return emptyResult;
  }

  const { services, total } = await serviceModel.listByVendorId(vendorId, options);
  const totalPages = total === 0 ? 0 : Math.ceil(total / options.pageSize);
  const pagination = { page: options.page, pageSize: options.pageSize, total, totalPages };

  if (!services.length) {
    return { services: [], pagination };
  }

  const allImages = await portfolioModel.findByServiceIds(services.map((service) => service.id));
  const imagesByServiceId = new Map();
  allImages.forEach((image) => {
    const list = imagesByServiceId.get(image.service_id) || [];
    list.push({ id: image.id, image_url: image.image_url });
    imagesByServiceId.set(image.service_id, list);
  });

  return {
    services: services.map((service) => toServiceView(service, imagesByServiceId.get(service.id) || [])),
    pagination,
  };
}

async function getMyServiceById(userId, vendorIdHint, serviceId) {
  // These three lookups are independent of each other, so run them together
  // instead of paying for three round trips end-to-end.
  const [vendorId, service, images] = await Promise.all([
    resolveVendorId(userId, vendorIdHint),
    serviceModel.findById(serviceId),
    portfolioModel.findByServiceId(serviceId),
  ]);

  if (!vendorId || !service || service.vendor_id !== vendorId) {
    throw new AppError(404, 'Service not found.');
  }

  return toServiceView(
    service,
    images.map((image) => ({ id: image.id, image_url: image.image_url }))
  );
}

async function updateMyService(userId, vendorIdHint, serviceId, payload, files = []) {
  const [vendorId, existing] = await Promise.all([
    resolveVendorId(userId, vendorIdHint),
    serviceModel.findById(serviceId),
  ]);

  if (!vendorId || !existing || existing.vendor_id !== vendorId) {
    throw new AppError(404, 'Service not found.');
  }

  const existingImages = await portfolioModel.findByServiceId(serviceId);

  const removeIds = new Set(toIdArray(payload.remove_image_ids));
  const imagesToRemove = existingImages.filter((image) => removeIds.has(image.id));
  const imagesToKeep = existingImages.filter((image) => !removeIds.has(image.id));

  const remainingSlots = MAX_SERVICE_IMAGES - imagesToKeep.length;
  if (files.length > remainingSlots) {
    throw new AppError(400, `You can upload up to ${MAX_SERVICE_IMAGES} images per service.`);
  }

  const [service] = await Promise.all([
    serviceModel.updateById(serviceId, toServiceFields(payload)),
    imagesToRemove.length
      ? portfolioModel.deleteByIds(serviceId, imagesToRemove.map((image) => image.id))
      : Promise.resolve(),
  ]);

  if (imagesToRemove.length) {
    try {
      await storageService.removeServiceImages(imagesToRemove.map((image) => image.image_url));
    } catch (error) {
      // Rows are already gone; leftover storage files are not fatal.
    }
  }

  const newImages = await uploadNewImages(vendorId, serviceId, files);

  const finalImages = [
    ...imagesToKeep.map((image) => ({ id: image.id, image_url: image.image_url })),
    ...newImages,
  ];

  return toServiceView(service, finalImages);
}

async function deleteMyService(userId, vendorIdHint, serviceId) {
  const [vendorId, existing, images] = await Promise.all([
    resolveVendorId(userId, vendorIdHint),
    serviceModel.findById(serviceId),
    portfolioModel.findByServiceId(serviceId),
  ]);

  if (!vendorId || !existing || existing.vendor_id !== vendorId) {
    throw new AppError(404, 'Service not found.');
  }

  await serviceModel.deleteById(serviceId);

  if (images.length) {
    try {
      await storageService.removeServiceImages(images.map((image) => image.image_url));
    } catch (error) {
      // Service row is already gone; leftover storage files are not fatal.
    }
  }
}

// Lightweight list for the Create Quotation page's "link to one of your
// services" picker — active services only, no pagination/images overhead.
async function listMyServiceOptions(userId, vendorIdHint) {
  const vendorId = await resolveVendorId(userId, vendorIdHint);
  if (!vendorId) {
    return [];
  }

  return serviceModel.findActiveByVendorIds([vendorId]);
}

const TOP_SERVICES_PERIODS = ['month', 'last30', 'last90'];
const TOP_SERVICES_LIMIT = 5;

function getTopServicesPeriodStart(period, now) {
  if (period === 'last30') {
    const start = new Date(now);
    start.setDate(start.getDate() - 29);
    start.setHours(0, 0, 0, 0);
    return start;
  }
  if (period === 'last90') {
    const start = new Date(now);
    start.setDate(start.getDate() - 89);
    start.setHours(0, 0, 0, 0);
    return start;
  }
  // 'month' — calendar month to date, matching the "This Month" label.
  return new Date(now.getFullYear(), now.getMonth(), 1);
}

// Ranks a vendor's own services by bookings/revenue within a period. A
// booking's items only carry a service_id when the vendor picked one of
// their own services while quoting (see quotation_items.service_id) — a
// custom/free-text line item has no service_id and is excluded, since it
// isn't attributable to any one catalog service.
async function getTopServicesForVendor(vendorId, period) {
  const safePeriod = TOP_SERVICES_PERIODS.includes(period) ? period : 'month';
  const periodStart = getTopServicesPeriodStart(safePeriod, new Date());

  const { services } = await serviceModel.listByVendorId(vendorId, { page: 1, pageSize: 500 });
  if (!services.length) {
    return [];
  }

  const bookings = await bookingModel.listByVendorId(vendorId);
  const eligibleBookings = bookings.filter(
    (booking) => booking.status !== 'cancelled' && new Date(booking.created_at) >= periodStart
  );

  const statsByServiceId = new Map();
  if (eligibleBookings.length) {
    const items = await quotationModel.findItemsByQuotationIds(eligibleBookings.map((booking) => booking.quotation_id));

    for (const item of items) {
      if (!item.service_id) continue;
      const stat = statsByServiceId.get(item.service_id) || { bookingIds: new Set(), revenue: 0 };
      stat.bookingIds.add(item.quotation_id);
      stat.revenue += Number(item.total_price) * (1 - PLATFORM_COMMISSION_RATE);
      statsByServiceId.set(item.service_id, stat);
    }
  }

  // Every service is shown, including ones with zero bookings this period —
  // not just the ones with activity — so a vendor can see their whole
  // catalog's standing at a glance, not a list that shrinks to nothing.
  return services
    .map((service) => {
      const stat = statsByServiceId.get(service.id);
      return {
        id: service.id,
        name: service.service_name,
        category: service.service_category,
        bookings: stat ? stat.bookingIds.size : 0,
        revenue: stat ? Math.round(stat.revenue * 100) / 100 : 0,
      };
    })
    .sort((a, b) => b.bookings - a.bookings || b.revenue - a.revenue)
    .slice(0, TOP_SERVICES_LIMIT);
}

module.exports = {
  MAX_SERVICE_IMAGES,
  createService,
  listMyServices,
  listMyServiceOptions,
  getTopServicesForVendor,
  getMyServiceById,
  updateMyService,
  deleteMyService,
};
