const AppError = require('../utils/AppError');
const serviceModel = require('../models/serviceModel');
const savedServiceModel = require('../models/savedServiceModel');

async function saveService(userId, serviceId) {
  const service = await serviceModel.findById(serviceId);
  if (!service || !service.service_name) {
    throw new AppError(404, 'Service not found.');
  }

  return savedServiceModel.create(userId, serviceId);
}

async function unsaveService(userId, serviceId) {
  await savedServiceModel.remove(userId, serviceId);
}

async function listSavedServices(userId) {
  const rows = await savedServiceModel.listByUserId(userId);

  return rows
    .filter((row) => row.services && row.services.vendors)
    .map((row) => ({
      id: row.id,
      service_id: row.service_id,
      vendor_id: row.services.vendor_id,
      service_name: row.services.service_name,
      service_category: row.services.service_category,
      starting_price: row.services.starting_price,
      company_name: row.services.vendors.company_name,
      profile_image: row.services.vendors.profile_image,
      cover_image: row.services.vendors.cover_image,
      created_at: row.created_at,
    }));
}

async function listSavedServiceIds(userId) {
  return savedServiceModel.listServiceIdsByUserId(userId);
}

module.exports = { saveService, unsaveService, listSavedServices, listSavedServiceIds };
