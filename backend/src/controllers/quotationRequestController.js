const quotationRequestService = require('../services/quotationRequestService');
const { success } = require('../utils/apiResponse');

async function submit(req, res, next) {
  try {
    const request = await quotationRequestService.submitRequest(req.auth.sub, req.body, req.files);
    return success(res, 201, 'Quotation request sent.', { request });
  } catch (error) {
    return next(error);
  }
}

async function listMine(req, res, next) {
  try {
    const requests = await quotationRequestService.listVendorRequests(req.auth.sub, req.auth.vendor_id);
    return success(res, 200, 'Quotation requests retrieved.', { requests });
  } catch (error) {
    return next(error);
  }
}

async function getOne(req, res, next) {
  try {
    const request = await quotationRequestService.getVendorRequestDetail(
      req.auth.sub,
      req.auth.vendor_id,
      req.params.id
    );
    return success(res, 200, 'Quotation request retrieved.', { request });
  } catch (error) {
    return next(error);
  }
}

async function decline(req, res, next) {
  try {
    const request = await quotationRequestService.declineRequest(req.auth.sub, req.auth.vendor_id, req.params.id);
    return success(res, 200, 'Quotation request declined.', { request });
  } catch (error) {
    return next(error);
  }
}

async function cancel(req, res, next) {
  try {
    const request = await quotationRequestService.cancelRequest(req.auth.sub, req.params.id);
    return success(res, 200, 'Quotation request cancelled.', { request });
  } catch (error) {
    return next(error);
  }
}

module.exports = { submit, listMine, getOne, decline, cancel };
