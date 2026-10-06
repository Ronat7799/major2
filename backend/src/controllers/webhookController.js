const stripe = require('../config/stripe');
const env = require('../config/env');
const paymentService = require('../services/paymentService');
const vendorPayoutService = require('../services/vendorPayoutService');

async function handleStripeWebhook(req, res) {
  if (!env.stripeWebhookSecret) {
    console.error('STRIPE_WEBHOOK_SECRET is not configured — cannot verify webhook signatures.');
    return res.status(500).send('Webhook secret not configured.');
  }

  const signature = req.headers['stripe-signature'];

  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, signature, env.stripeWebhookSecret);
  } catch (err) {
    console.error('Stripe webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    if (event.type.startsWith('account.')) {
      await vendorPayoutService.handleAccountWebhookEvent(event);
    } else {
      await paymentService.handleWebhookEvent(event);
    }
  } catch (err) {
    console.error('Error handling Stripe webhook event:', err.message);
  }

  return res.json({ received: true });
}

module.exports = { handleStripeWebhook };
