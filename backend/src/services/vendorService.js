const AppError = require('../utils/AppError');
const userModel = require('../models/userModel');
const vendorModel = require('../models/vendorModel');
const serviceModel = require('../models/serviceModel');
const portfolioModel = require('../models/portfolioModel');
const reviewModel = require('../models/reviewModel');
const bookingModel = require('../models/bookingModel');
const quotationRequestModel = require('../models/quotationRequestModel');
const storageService = require('./storageService');
const paymentService = require('./paymentService');
const bookingService = require('./bookingService');
const conversationService = require('./conversationService');
const serviceService = require('./serviceService');
const quotationModel = require('../models/quotationModel');
const quotationService = require('./quotationService');
const { toVendorProfileView } = require('../utils/vendorView');

const REVENUE_SERIES_PERIODS = ['daily', 'week', 'month', 'year'];

const FEATURED_VENDOR_LIMIT = 6;

function shuffle(items) {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

async function firstImageByServiceId(serviceIds) {
  const images = await portfolioModel.findByServiceIds(serviceIds);
  const map = new Map();
  images.forEach((image) => {
    if (!map.has(image.service_id)) {
      map.set(image.service_id, image.image_url);
    }
  });
  return map;
}

async function listFeaturedVendors(limit = FEATURED_VENDOR_LIMIT) {
  const vendors = await vendorModel.listCompletedProfiles();
  if (!vendors.length) {
    return [];
  }

  const vendorById = new Map(vendors.map((vendor) => [vendor.id, vendor]));
  const activeServices = await serviceModel.findActiveByVendorIds(vendors.map((vendor) => vendor.id));
  const coverByServiceId = await firstImageByServiceId(activeServices.map((service) => service.id));

  const listings = activeServices.map((service) => {
    const vendor = vendorById.get(service.vendor_id);
    return {
      id: service.id,
      vendor_id: vendor.id,
      service_name: service.service_name,
      company_name: vendor.company_name,
      profile_image: vendor.profile_image,
      cover_image: coverByServiceId.get(service.id) || null,
      business_category: service.service_category,
      business_description: service.service_description,
      starting_price: Number(service.starting_price),
    };
  });

  return shuffle(listings).slice(0, limit);
}

const BROWSE_PAGE_SIZE = 6;

const BUDGET_RANGES = {
  under_500: { min: 0, max: 500 },
  '500_2000': { min: 500, max: 2000 },
  '2000_5000': { min: 2000, max: 5000 },
  '5000_10000': { min: 5000, max: 10000 },
  over_10000: { min: 10000, max: null },
};

const BROWSE_SORT_COMPARATORS = {
  newest: (a, b) => new Date(b.created_at) - new Date(a.created_at),
  price_asc: (a, b) => a.starting_price - b.starting_price,
  price_desc: (a, b) => b.starting_price - a.starting_price,
};

async function listBrowseVendors(filters = {}) {
  const page = Math.max(1, parseInt(filters.page, 10) || 1);
  const pageSize = BROWSE_PAGE_SIZE;
  const emptyResult = { vendors: [], pagination: { page, pageSize, total: 0, totalPages: 0 } };

  const category = filters.category ? String(filters.category).trim() : '';
  const location = filters.location ? String(filters.location).trim() : '';
  const search = filters.search ? String(filters.search).trim() : '';
  const budgetRange = BUDGET_RANGES[filters.budget] || null;
  const sortComparator = BROWSE_SORT_COMPARATORS[filters.sort] || BROWSE_SORT_COMPARATORS.newest;

  const vendors = await vendorModel.listCompletedProfiles({ location });
  if (!vendors.length) {
    return emptyResult;
  }

  const vendorById = new Map(vendors.map((vendor) => [vendor.id, vendor]));
  const activeServices = await serviceModel.findActiveByVendorIds(vendors.map((vendor) => vendor.id), {
    category,
    minPrice: budgetRange ? budgetRange.min : undefined,
    maxPrice: budgetRange ? budgetRange.max : undefined,
  });

  const searchLower = search.toLowerCase();
  const searchedServices = search
    ? activeServices.filter((service) => {
        const vendor = vendorById.get(service.vendor_id);
        return (
          service.service_name.toLowerCase().includes(searchLower) ||
          (vendor?.company_name || '').toLowerCase().includes(searchLower)
        );
      })
    : activeServices;

  const coverByServiceId = await firstImageByServiceId(searchedServices.map((service) => service.id));

  const resultVendorIds = [...new Set(searchedServices.map((service) => service.vendor_id))];
  const reviews = await reviewModel.findByVendorIds(resultVendorIds);
  const reviewsByVendorId = new Map();
  reviews.forEach((review) => {
    const list = reviewsByVendorId.get(review.vendor_id) || [];
    list.push(review);
    reviewsByVendorId.set(review.vendor_id, list);
  });

  const listings = searchedServices
    .map((service) => {
      const vendor = vendorById.get(service.vendor_id);
      const rating = summarizeRatings(reviewsByVendorId.get(vendor.id) || []);
      return {
        id: service.id,
        vendor_id: vendor.id,
        service_name: service.service_name,
        company_name: vendor.company_name,
        profile_image: vendor.profile_image,
        cover_image: coverByServiceId.get(service.id) || null,
        business_category: service.service_category,
        business_description: service.service_description,
        starting_price: Number(service.starting_price),
        rating_average: rating.average,
        rating_total: rating.total,
        created_at: service.created_at,
      };
    })
    .sort(sortComparator);

  const total = listings.length;
  if (total === 0) {
    return emptyResult;
  }

  const totalPages = Math.ceil(total / pageSize);
  const from = (page - 1) * pageSize;
  const pageListings = listings.slice(from, from + pageSize).map(({ created_at, ...listing }) => listing);

  return { vendors: pageListings, pagination: { page, pageSize, total, totalPages } };
}

function summarizeRatings(reviews) {
  const total = reviews.length;
  const average = total ? Number((reviews.reduce((sum, review) => sum + review.rating, 0) / total).toFixed(1)) : null;
  return { average, total };
}

async function getMyReviews(userId) {
  const vendor = await vendorModel.findByUserId(userId);
  if (!vendor) {
    throw new AppError(404, 'Vendor profile not found.');
  }

  const reviews = await reviewModel.findByVendorId(vendor.id);

  return {
    rating: summarizeRatings(reviews),
    reviews: reviews.map((review) => ({
      id: review.id,
      rating: review.rating,
      comment: review.comment,
      created_at: review.created_at,
      reviewer_name: review.users?.full_name || 'Anonymous',
    })),
  };
}

async function getVendorAvailability(vendorId) {
  const schedule = await bookingModel.findConfirmedScheduleByVendorId(vendorId);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const bookedDates = [
    ...new Set(
      schedule
        .filter((booking) => booking.booking_date && new Date(`${booking.booking_date}T00:00:00`) >= today)
        .map((booking) => booking.booking_date)
    ),
  ];

  return { bookedDates };
}

async function getVendorDetail(vendorId, { serviceId } = {}) {
  const vendor = await vendorModel.findById(vendorId);
  if (!vendor || !vendor.company_name) {
    throw new AppError(404, 'Vendor not found.');
  }

  const services = await serviceModel.findActiveByVendorIds([vendorId]);
  const featuredService = serviceId ? services.find((service) => service.id === serviceId) : null;

  const portfolioImages = featuredService
    ? await portfolioModel.findByServiceId(featuredService.id)
    : await portfolioModel.findByServiceIds(services.map((service) => service.id));
  const reviews = await reviewModel.findByVendorId(vendorId);
  const user = await userModel.findById(vendor.user_id);

  const categories = [...new Set(services.map((service) => service.service_category).filter(Boolean))];
  if (categories.length === 0 && vendor.business_category) {
    categories.push(vendor.business_category);
  }

  const { average: averageRating, total: totalReviews } = summarizeRatings(reviews);

  return {
    vendor: {
      id: vendor.id,
      company_name: vendor.company_name,
      contact_person: vendor.contact_person,
      business_category: vendor.business_category,
      business_address: vendor.business_address,
      business_description: vendor.business_description,
      year_of_experience: vendor.year_of_experience,
      profile_image: vendor.profile_image,
      cover_image: vendor.cover_image,
      full_address: vendor.full_address,
      latitude: vendor.latitude,
      longitude: vendor.longitude,
      languages_spoken: vendor.languages_spoken || [],
      email: user ? user.email : null,
      phone: user ? user.phone : null,
      categories,
    },
    services: services.map((service) => ({
      id: service.id,
      service_name: service.service_name,
      service_category: service.service_category,
      service_description: service.service_description,
      starting_price: service.starting_price != null ? Number(service.starting_price) : null,
    })),
    portfolio: portfolioImages.map((image) => ({ id: image.id, image_url: image.image_url })),
    portfolio_service_name: featuredService ? featuredService.service_name : null,
    reviews: reviews.map((review) => ({
      id: review.id,
      rating: review.rating,
      comment: review.comment,
      created_at: review.created_at,
      reviewer_name: review.users?.full_name || 'Anonymous',
    })),
    rating: { average: averageRating, total: totalReviews },
  };
}

async function getMyProfile(userId) {
  let vendor = await vendorModel.findByUserId(userId);
  if (!vendor) {
    vendor = await vendorModel.createEmptyForUser(userId);
  }

  const user = await userModel.findById(userId);
  if (!user) {
    throw new AppError(401, 'Account not found.');
  }

  return toVendorProfileView(vendor, user);
}

async function getMyRevenue(userId) {
  const vendor = await vendorModel.findByUserId(userId);
  if (!vendor) {
    return { totalRevenue: 0, changePercent: 0 };
  }

  return paymentService.getVendorRevenue(vendor.id);
}

async function getMyRevenueSeries(userId, period) {
  const safePeriod = REVENUE_SERIES_PERIODS.includes(period) ? period : 'month';
  const vendor = await vendorModel.findByUserId(userId);
  if (!vendor) {
    return { period: safePeriod, totalRevenue: 0, changePercent: 0, points: [] };
  }

  return paymentService.getVendorRevenueSeries(vendor.id, safePeriod);
}

async function getMyTopServices(userId, period) {
  const vendor = await vendorModel.findByUserId(userId);
  if (!vendor) {
    return [];
  }

  return serviceService.getTopServicesForVendor(vendor.id, period);
}

async function getMyDashboardStats(userId) {
  const vendor = await vendorModel.findByUserId(userId);
  if (!vendor) {
    return { activeBookings: 0, pendingQuotations: 0, completedEvents: 0, averageRating: null, reviewCount: 0 };
  }

  const [bookings, requests, reviews] = await Promise.all([
    bookingModel.listByVendorId(vendor.id),
    quotationRequestModel.listByVendorId(vendor.id),
    reviewModel.findByVendorId(vendor.id),
  ]);

  const activeBookings = bookings.filter((booking) => booking.status === 'confirmed').length;
  const completedEvents = bookings.filter((booking) => booking.status === 'completed').length;
  const pendingQuotations = requests.filter((request) => request.status === 'pending').length;

  const reviewCount = reviews.length;
  const averageRating = reviewCount
    ? Number((reviews.reduce((sum, review) => sum + review.rating, 0) / reviewCount).toFixed(1))
    : null;

  return { activeBookings, pendingQuotations, completedEvents, averageRating, reviewCount };
}

async function getMyUpcomingEvents(userId, limit) {
  const vendor = await vendorModel.findByUserId(userId);
  if (!vendor) {
    return [];
  }

  return bookingService.getUpcomingEventsForVendor(vendor.id, limit);
}

async function getMyAttentionSummary(userId, { bookingsSeenSince } = {}) {
  await quotationService.expireOverdueRevisionRequests();

  const vendor = await vendorModel.findByUserId(userId);
  if (!vendor) {
    return {
      pendingQuotations: 0,
      bookingsTomorrow: 0,
      unreadMessages: 0,
      paymentsAwaitingConfirmation: 0,
      newBookingPayments: 0,
    };
  }

  const seenSince = bookingsSeenSince ? new Date(bookingsSeenSince) : null;
  const hasSeenSince = seenSince && !Number.isNaN(seenSince.getTime());

  const [requests, revisionRequested, bookingsTomorrow, unreadMessages, paymentsAwaitingConfirmation, newBookingPayments] =
    await Promise.all([
      quotationRequestModel.listByVendorId(vendor.id),
      quotationModel.listByVendorIdAndStatus(vendor.id, 'revision_requested', 500),
      bookingService.countBookingsStartingTomorrowForVendor(vendor.id),
      conversationService.countUnreadMessagesForVendor(vendor.id, userId),
      paymentService.countPendingPaymentsForVendor(vendor.id),
      hasSeenSince ? paymentService.countPaidPaymentsForVendorSince(vendor.id, seenSince) : Promise.resolve(0),
    ]);

  const pendingQuotations =
    requests.filter((request) => request.status === 'pending').length + revisionRequested.length;

  return { pendingQuotations, bookingsTomorrow, unreadMessages, paymentsAwaitingConfirmation, newBookingPayments };
}

const RECENT_ACTIVITY_LIMIT = 8;

async function getMyRecentActivity(userId, { limit = RECENT_ACTIVITY_LIMIT, types } = {}) {
  const vendor = await vendorModel.findByUserId(userId);
  if (!vendor) {
    return [];
  }

  const wantsType = (type) => !types || types.includes(type);
  const wantsPayments = wantsType('payment_deposit_paid') || wantsType('payment_balance_paid');
  const needsBookings = wantsType('booking_completed') || wantsType('booking_cancelled') || wantsPayments;

  const [requests, acceptedQuotations, revisionRequestedQuotations, bookings, reviews, messages] = await Promise.all([
    wantsType('quotation_request') ? quotationRequestModel.listByVendorId(vendor.id) : Promise.resolve([]),
    wantsType('quotation_accepted') ? quotationModel.listByVendorIdAndStatus(vendor.id, 'accepted', limit) : Promise.resolve([]),
    wantsType('quotation_revision_requested')
      ? quotationModel.listByVendorIdAndStatus(vendor.id, 'revision_requested', limit)
      : Promise.resolve([]),
    needsBookings ? bookingModel.listByVendorId(vendor.id) : Promise.resolve([]),
    wantsType('review') ? reviewModel.findByVendorId(vendor.id) : Promise.resolve([]),
    wantsType('message') ? conversationService.listRecentCustomerMessagesForVendor(vendor.id, userId, limit) : Promise.resolve([]),
  ]);

  const paidPayments = wantsPayments ? await paymentService.listPaidPaymentsForBookings(bookings) : [];

  const events = [];

  requests.slice(0, limit).forEach((request) => {
    events.push({
      id: `request-${request.id}`,
      type: 'quotation_request',
      text: `New quotation request received from ${request.users?.full_name || 'a customer'}`,
      timestamp: request.created_at,
      path: `/vendor/quotation-requests/${request.id}`,
    });
  });

  acceptedQuotations.forEach((quotation) => {
    const customerName = quotation.quotation_requests?.users?.full_name || 'A customer';
    const requestId = quotation.quotation_requests?.id;
    events.push({
      id: `accepted-${quotation.id}`,
      type: 'quotation_accepted',
      text: `${customerName} accepted your quotation`,
      timestamp: quotation.updated_at,
      path: requestId ? `/vendor/quotation-requests/${requestId}` : null,
    });
  });

  revisionRequestedQuotations.forEach((quotation) => {
    const customerName = quotation.quotation_requests?.users?.full_name || 'A customer';
    const requestId = quotation.quotation_requests?.id;
    events.push({
      id: `revision-${quotation.id}`,
      type: 'quotation_revision_requested',
      text: `${customerName} requested changes to your quotation`,
      timestamp: quotation.updated_at,
      path: requestId ? `/vendor/quotation-requests/${requestId}` : null,
    });
  });

  if (wantsType('booking_completed')) {
    bookings
      .filter((booking) => booking.status === 'completed')
      .slice(0, limit)
      .forEach((booking) => {
        events.push({
          id: `completed-${booking.id}`,
          type: 'booking_completed',
          text: `Booking with ${booking.users?.full_name || 'a customer'} marked as completed`,
          timestamp: booking.updated_at,
          path: `/vendor/bookings/${booking.id}`,
        });
      });
  }

  if (wantsType('booking_cancelled')) {
    bookings
      .filter((booking) => booking.status === 'cancelled')
      .slice(0, limit)
      .forEach((booking) => {
        events.push({
          id: `cancelled-${booking.id}`,
          type: 'booking_cancelled',
          text: `Booking with ${booking.users?.full_name || 'a customer'} was cancelled`,
          timestamp: booking.updated_at,
          path: `/vendor/bookings/${booking.id}`,
        });
      });
  }

  if (wantsType('payment_deposit_paid')) {
    paidPayments
      .filter((payment) => payment.payment_type === 'deposit')
      .slice(0, limit)
      .forEach((payment) => {
        events.push({
          id: `deposit-${payment.id}`,
          type: 'payment_deposit_paid',
          text: `${payment.booking?.users?.full_name || 'A customer'} paid the deposit`,
          timestamp: payment.paid_at,
          path: payment.booking ? `/vendor/bookings/${payment.booking.id}` : null,
        });
      });
  }

  if (wantsType('payment_balance_paid')) {
    paidPayments
      .filter((payment) => payment.payment_type === 'balance' || payment.payment_type === 'full')
      .slice(0, limit)
      .forEach((payment) => {
        const customerName = payment.booking?.users?.full_name || 'A customer';
        events.push({
          id: `balance-${payment.id}`,
          type: 'payment_balance_paid',
          text: payment.payment_type === 'full' ? `${customerName} paid in full` : `${customerName} paid the remaining balance`,
          timestamp: payment.paid_at,
          path: payment.booking ? `/vendor/bookings/${payment.booking.id}` : null,
        });
      });
  }

  reviews.slice(0, limit).forEach((review) => {
    events.push({
      id: `review-${review.id}`,
      path: '/vendor/reviews',
      type: 'review',
      text: `New ${review.rating}-star review received from ${review.users?.full_name || 'a customer'}`,
      timestamp: review.created_at,
    });
  });

  messages.forEach((message) => {
    events.push({
      id: `message-${message.id}`,
      type: 'message',
      text: `${message.customerName} sent you a message`,
      timestamp: message.createdAt,
      path: '/vendor/messages',
      conversationId: message.conversationId,
    });
  });

  return events.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).slice(0, limit);
}

const NOTIFICATIONS_LIMIT = 50;

const NOTIFICATION_TYPES = [
  'quotation_request',
  'quotation_accepted',
  'quotation_revision_requested',
  'payment_deposit_paid',
  'payment_balance_paid',
  'booking_completed',
  'booking_cancelled',
  'review',
  'message',
];

const NOTIFICATION_RANGE_DAYS = { today: 1, week: 7, month: 30 };

function notificationRangeStart(range) {
  if (!range || !NOTIFICATION_RANGE_DAYS[range]) {
    return null;
  }
  if (range === 'today') {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    return start;
  }
  return new Date(Date.now() - NOTIFICATION_RANGE_DAYS[range] * 86400000);
}

async function getMyNotifications(userId, { range, limit = NOTIFICATIONS_LIMIT } = {}) {
  const [user, events] = await Promise.all([
    userModel.findById(userId),
    getMyRecentActivity(userId, { limit, types: NOTIFICATION_TYPES }),
  ]);

  const rangeStart = notificationRangeStart(range);
  const lastReadAt = user?.notifications_last_read_at ? new Date(user.notifications_last_read_at) : null;

  return events
    .filter((event) => !rangeStart || new Date(event.timestamp) >= rangeStart)
    .map((event) => ({ ...event, unread: !lastReadAt || new Date(event.timestamp) > lastReadAt }));
}

async function getMyUnreadNotificationCount(userId) {
  const notifications = await getMyNotifications(userId);
  return notifications.filter((notification) => notification.unread).length;
}

async function markMyNotificationsRead(userId) {
  await userModel.markNotificationsRead(userId);
}

async function updateMyProfile(userId, payload) {
  const {
    company_name,
    contact_person,
    business_category,
    business_address,
    business_description,
    year_of_experience,
    full_address,
    latitude,
    longitude,
    phone,
    languages_spoken,
  } = payload;

  const existingVendor = await vendorModel.findByUserId(userId);
  if (!existingVendor) {
    await vendorModel.createEmptyForUser(userId);
  }

  const vendor = await vendorModel.updateByUserId(userId, {
    company_name: company_name.trim(),
    contact_person: contact_person.trim(),
    business_category: business_category ? business_category.trim() : null,
    business_address: business_address ? business_address.trim() : null,
    business_description: business_description ? business_description.trim() : null,
    year_of_experience:
      year_of_experience === '' || year_of_experience == null ? null : Number(year_of_experience),
    full_address: full_address ? full_address.trim() : null,
    latitude: latitude === '' || latitude == null ? null : Number(latitude),
    longitude: longitude === '' || longitude == null ? null : Number(longitude),
    languages_spoken: Array.isArray(languages_spoken) ? languages_spoken : [],
  });

  const user = await userModel.updateContactInfo(userId, {
    full_name: contact_person.trim(),
    phone: phone ? phone.trim() : null,
  });

  return toVendorProfileView(vendor, user);
}

async function updateProfileImage(userId, file) {
  if (!file) {
    throw new AppError(400, 'An image file is required.');
  }

  const existingVendor = await vendorModel.findByUserId(userId);
  if (!existingVendor) {
    await vendorModel.createEmptyForUser(userId);
  }

  const imageUrl = await storageService.uploadUserImage('profile-images', userId, file);
  const vendor = await vendorModel.updateByUserId(userId, { profile_image: imageUrl });

  const user = await userModel.findById(userId);
  return toVendorProfileView(vendor, user);
}

async function updateCoverImage(userId, file) {
  if (!file) {
    throw new AppError(400, 'An image file is required.');
  }

  const existingVendor = await vendorModel.findByUserId(userId);
  if (!existingVendor) {
    await vendorModel.createEmptyForUser(userId);
  }

  const imageUrl = await storageService.uploadUserImage('cover-images', userId, file);
  const vendor = await vendorModel.updateByUserId(userId, { cover_image: imageUrl });

  const user = await userModel.findById(userId);
  return toVendorProfileView(vendor, user);
}

module.exports = {
  getMyProfile,
  getMyRevenue,
  getMyRevenueSeries,
  getMyTopServices,
  getMyDashboardStats,
  getMyUpcomingEvents,
  getMyAttentionSummary,
  getMyRecentActivity,
  getMyNotifications,
  getMyUnreadNotificationCount,
  markMyNotificationsRead,
  updateMyProfile,
  updateProfileImage,
  updateCoverImage,
  listFeaturedVendors,
  listBrowseVendors,
  getVendorDetail,
  getVendorAvailability,
  getMyReviews,
};
