const serviceService = require('../services/serviceService');
const { success } = require('../utils/apiResponse');

async function createService(req, res, next) {
  try {
    const service = await serviceService.createService(
      req.auth.sub,
      req.auth.vendor_id,
      req.body,
      req.files
    );
    return success(res, 201, 'Service created.', { service });
  } catch (error) {
    return next(error);
  }
}

async function listMine(req, res, next) {
  try {
    const { search, category, status, sort, page } = req.query;
    const { services, pagination } = await serviceService.listMyServices(req.auth.sub, req.auth.vendor_id, {
      search,
      category,
      status,
      sort,
      page,
    });
    return success(res, 200, 'Services retrieved.', { services, pagination });
  } catch (error) {
    return next(error);
  }
}

async function listMineOptions(req, res, next) {
  try {
    const services = await serviceService.listMyServiceOptions(req.auth.sub, req.auth.vendor_id);
    return success(res, 200, 'Services retrieved.', { services });
  } catch (error) {
    return next(error);
  }
}

async function getOne(req, res, next) {
  try {
    const service = await serviceService.getMyServiceById(req.auth.sub, req.auth.vendor_id, req.params.id);
    return success(res, 200, 'Service retrieved.', { service });
  } catch (error) {
    return next(error);
  }
}

async function update(req, res, next) {
  try {
    const service = await serviceService.updateMyService(
      req.auth.sub,
      req.auth.vendor_id,
      req.params.id,
      req.body,
      req.files
    );
    return success(res, 200, 'Service updated.', { service });
  } catch (error) {
    return next(error);
  }
}

async function remove(req, res, next) {
  try {
    await serviceService.deleteMyService(req.auth.sub, req.auth.vendor_id, req.params.id);
    return success(res, 200, 'Service deleted.');
  } catch (error) {
    return next(error);
  }
}

module.exports = { createService, listMine, listMineOptions, getOne, update, remove };
