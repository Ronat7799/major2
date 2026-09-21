const quotationService = require('../services/quotationService');
const { success } = require('../utils/apiResponse');

async function create(req, res, next) {
  try {
    const quotation = await quotationService.createQuotationForRequest(
      req.auth.sub,
      req.auth.vendor_id,
      req.params.id,
      req.body
    );
    return success(res, 201, 'Quotation sent.', { quotation });
  } catch (error) {
    return next(error);
  }
}

async function listMine(req, res, next) {
  try {
    const quotations = await quotationService.listMyQuotations(req.auth.sub);
    return success(res, 200, 'Quotations retrieved.', { quotations });
  } catch (error) {
    return next(error);
  }
}

async function getOne(req, res, next) {
  try {
    const quotation = await quotationService.getQuotationDetailForCustomer(req.auth.sub, req.params.id);
    return success(res, 200, 'Quotation retrieved.', { quotation });
  } catch (error) {
    return next(error);
  }
}

async function accept(req, res, next) {
  try {
    const quotation = await quotationService.acceptQuotation(req.auth.sub, req.params.id);
    return success(res, 200, 'Quotation accepted.', { quotation });
  } catch (error) {
    return next(error);
  }
}

async function decline(req, res, next) {
  try {
    const quotation = await quotationService.declineQuotation(req.auth.sub, req.params.id);
    return success(res, 200, 'Quotation declined.', { quotation });
  } catch (error) {
    return next(error);
  }
}

async function requestChanges(req, res, next) {
  try {
    const quotation = await quotationService.requestRevision(req.auth.sub, req.params.id, req.body.note);
    return success(res, 200, 'Change request sent to the vendor.', { quotation });
  } catch (error) {
    return next(error);
  }
}

async function revise(req, res, next) {
  try {
    const quotation = await quotationService.createRevisionForQuotation(
      req.auth.sub,
      req.auth.vendor_id,
      req.params.id,
      req.body
    );
    return success(res, 201, 'Revised quotation sent.', { quotation });
  } catch (error) {
    return next(error);
  }
}

async function sendChatInvite(req, res, next) {
  try {
    const invite = await quotationService.createChatInviteForQuotation(req.auth.sub, req.auth.vendor_id, req.params.id);
    return success(res, 200, 'Chat invite sent.', invite);
  } catch (error) {
    return next(error);
  }
}

module.exports = { create, listMine, getOne, accept, decline, requestChanges, revise, sendChatInvite };
