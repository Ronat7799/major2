const paymentService = require('../services/paymentService');
const { success } = require('../utils/apiResponse');

async function createDepositIntent(req, res, next) {
  try {
    const payment = await paymentService.createPaymentIntentForBooking(req.auth.sub, req.params.id, 'deposit');
    return success(res, 200, 'Deposit payment intent created.', payment);
  } catch (error) {
    return next(error);
  }
}

async function createBalanceIntent(req, res, next) {
  try {
    const payment = await paymentService.createPaymentIntentForBooking(req.auth.sub, req.params.id, 'balance');
    return success(res, 200, 'Balance payment intent created.', payment);
  } catch (error) {
    return next(error);
  }
}

async function simulateDeposit(req, res, next) {
  try {
    const payment = await paymentService.simulatePaymentForBooking(req.auth.sub, req.params.id, 'deposit', req.body);
    return success(res, 200, 'Deposit payment simulated.', payment);
  } catch (error) {
    return next(error);
  }
}

async function simulateBalance(req, res, next) {
  try {
    const payment = await paymentService.simulatePaymentForBooking(req.auth.sub, req.params.id, 'balance', req.body);
    return success(res, 200, 'Balance payment simulated.', payment);
  } catch (error) {
    return next(error);
  }
}

module.exports = { createDepositIntent, createBalanceIntent, simulateDeposit, simulateBalance };
