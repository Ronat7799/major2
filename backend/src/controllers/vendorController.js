const vendorService = require('../services/vendorService');
const { success } = require('../utils/apiResponse');

async function getMyProfile(req, res, next) {
  try {
    const profile = await vendorService.getMyProfile(req.auth.sub);
    return success(res, 200, 'Vendor profile retrieved.', { profile });
  } catch (error) {
    return next(error);
  }
}

async function getMyRevenue(req, res, next) {
  try {
    const revenue = await vendorService.getMyRevenue(req.auth.sub);
    return success(res, 200, 'Vendor revenue retrieved.', { revenue });
  } catch (error) {
    return next(error);
  }
}

async function getMyRevenueSeries(req, res, next) {
  try {
    const series = await vendorService.getMyRevenueSeries(req.auth.sub, req.query.period);
    return success(res, 200, 'Vendor revenue series retrieved.', { series });
  } catch (error) {
    return next(error);
  }
}

async function getMyTopServices(req, res, next) {
  try {
    const services = await vendorService.getMyTopServices(req.auth.sub, req.query.period);
    return success(res, 200, 'Top services retrieved.', { services });
  } catch (error) {
    return next(error);
  }
}

async function getMyStats(req, res, next) {
  try {
    const stats = await vendorService.getMyDashboardStats(req.auth.sub);
    return success(res, 200, 'Vendor stats retrieved.', { stats });
  } catch (error) {
    return next(error);
  }
}

async function getMyUpcomingEvents(req, res, next) {
  try {
    const limit = req.query.limit ? Number(req.query.limit) : undefined;
    const events = await vendorService.getMyUpcomingEvents(req.auth.sub, limit);
    return success(res, 200, 'Upcoming events retrieved.', { events });
  } catch (error) {
    return next(error);
  }
}

async function getMyAttentionSummary(req, res, next) {
  try {
    const attention = await vendorService.getMyAttentionSummary(req.auth.sub);
    return success(res, 200, 'Attention summary retrieved.', { attention });
  } catch (error) {
    return next(error);
  }
}

async function getMyRecentActivity(req, res, next) {
  try {
    const limit = req.query.limit ? Number(req.query.limit) : undefined;
    const types = req.query.types ? String(req.query.types).split(',') : undefined;
    const activity = await vendorService.getMyRecentActivity(req.auth.sub, { limit, types });
    return success(res, 200, 'Recent activity retrieved.', { activity });
  } catch (error) {
    return next(error);
  }
}

async function getMyNotifications(req, res, next) {
  try {
    const { range } = req.query;
    const limit = req.query.limit ? Number(req.query.limit) : undefined;
    const notifications = await vendorService.getMyNotifications(req.auth.sub, { range, limit });
    return success(res, 200, 'Notifications retrieved.', { notifications });
  } catch (error) {
    return next(error);
  }
}

async function getMyUnreadNotificationCount(req, res, next) {
  try {
    const count = await vendorService.getMyUnreadNotificationCount(req.auth.sub);
    return success(res, 200, 'Unread notification count retrieved.', { count });
  } catch (error) {
    return next(error);
  }
}

async function markMyNotificationsRead(req, res, next) {
  try {
    await vendorService.markMyNotificationsRead(req.auth.sub);
    return success(res, 200, 'Notifications marked as read.', {});
  } catch (error) {
    return next(error);
  }
}

async function updateMyProfile(req, res, next) {
  try {
    const profile = await vendorService.updateMyProfile(req.auth.sub, req.body);
    return success(res, 200, 'Vendor profile updated.', { profile });
  } catch (error) {
    return next(error);
  }
}

async function uploadProfileImage(req, res, next) {
  try {
    const profile = await vendorService.updateProfileImage(req.auth.sub, req.file);
    return success(res, 200, 'Profile image updated.', { profile });
  } catch (error) {
    return next(error);
  }
}

async function uploadCoverImage(req, res, next) {
  try {
    const profile = await vendorService.updateCoverImage(req.auth.sub, req.file);
    return success(res, 200, 'Cover image updated.', { profile });
  } catch (error) {
    return next(error);
  }
}

async function listFeatured(req, res, next) {
  try {
    const vendors = await vendorService.listFeaturedVendors();
    return success(res, 200, 'Featured vendors retrieved.', { vendors });
  } catch (error) {
    return next(error);
  }
}

async function listBrowse(req, res, next) {
  try {
    const { page, category, budget, location, search, sort } = req.query;
    const { vendors, pagination } = await vendorService.listBrowseVendors({
      page,
      category,
      budget,
      location,
      search,
      sort,
    });
    return success(res, 200, 'Vendors retrieved.', { vendors, pagination });
  } catch (error) {
    return next(error);
  }
}

async function getVendorDetail(req, res, next) {
  try {
    const detail = await vendorService.getVendorDetail(req.params.id, { serviceId: req.query.service });
    return success(res, 200, 'Vendor detail retrieved.', detail);
  } catch (error) {
    return next(error);
  }
}

async function getVendorAvailability(req, res, next) {
  try {
    const availability = await vendorService.getVendorAvailability(req.params.id);
    return success(res, 200, 'Vendor availability retrieved.', availability);
  } catch (error) {
    return next(error);
  }
}

async function getMyReviews(req, res, next) {
  try {
    const detail = await vendorService.getMyReviews(req.auth.sub);
    return success(res, 200, 'Reviews retrieved.', detail);
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  getMyProfile,
  getMyRevenue,
  getMyRevenueSeries,
  getMyTopServices,
  getMyStats,
  getMyUpcomingEvents,
  getMyAttentionSummary,
  getMyRecentActivity,
  getMyNotifications,
  getMyUnreadNotificationCount,
  markMyNotificationsRead,
  updateMyProfile,
  uploadProfileImage,
  uploadCoverImage,
  listFeatured,
  listBrowse,
  getVendorDetail,
  getVendorAvailability,
  getMyReviews,
};
