const vendorPayoutService = require('../services/vendorPayoutService');
const { success } = require('../utils/apiResponse');

async function createOnboardingLink(req, res, next) {
  try {
    const { url } = await vendorPayoutService.startOnboarding(req.auth.sub);
    return success(res, 200, 'Stripe onboarding link created.', { url });
  } catch (error) {
    return next(error);
  }
}

async function getStatus(req, res, next) {
  try {
    const status = await vendorPayoutService.getPayoutStatus(req.auth.sub);
    return success(res, 200, 'Payout status retrieved.', { status });
  } catch (error) {
    return next(error);
  }
}

module.exports = { createOnboardingLink, getStatus };
