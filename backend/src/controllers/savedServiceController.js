const savedServiceService = require('../services/savedServiceService');
const { success } = require('../utils/apiResponse');

async function save(req, res, next) {
  try {
    const savedService = await savedServiceService.saveService(req.auth.sub, req.body.service_id);
    return success(res, 201, 'Service saved.', { savedService });
  } catch (error) {
    return next(error);
  }
}

async function unsave(req, res, next) {
  try {
    await savedServiceService.unsaveService(req.auth.sub, req.params.serviceId);
    return success(res, 200, 'Service removed from saved vendors.');
  } catch (error) {
    return next(error);
  }
}

async function listMine(req, res, next) {
  try {
    const services = await savedServiceService.listSavedServices(req.auth.sub);
    return success(res, 200, 'Saved services retrieved.', { services });
  } catch (error) {
    return next(error);
  }
}

async function listMyIds(req, res, next) {
  try {
    const serviceIds = await savedServiceService.listSavedServiceIds(req.auth.sub);
    return success(res, 200, 'Saved service ids retrieved.', { serviceIds });
  } catch (error) {
    return next(error);
  }
}

module.exports = { save, unsave, listMine, listMyIds };
