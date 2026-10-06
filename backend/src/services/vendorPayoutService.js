const stripe = require('../config/stripe');
const env = require('../config/env');
const vendorModel = require('../models/vendorModel');

async function resolveVendor(userId) {
  let vendor = await vendorModel.findByUserId(userId);
  if (!vendor) {
    vendor = await vendorModel.createEmptyForUser(userId);
  }
  return vendor;
}

async function startOnboarding(userId) {
  const vendor = await resolveVendor(userId);
  const account = await vendorModel.findStripeAccountByVendorId(vendor.id);

  let stripeAccountId = account?.stripe_account_id || null;

  if (!stripeAccountId) {
    const stripeAccount = await stripe.accounts.create({ type: 'express' });
    stripeAccountId = stripeAccount.id;
    await vendorModel.updateStripeAccount(vendor.id, { stripe_account_id: stripeAccountId });
  }

  const accountLink = await stripe.accountLinks.create({
    account: stripeAccountId,
    refresh_url: `${env.frontendUrl}/vendor/settings?stripeReturn=refresh`,
    return_url: `${env.frontendUrl}/vendor/settings?stripeReturn=complete`,
    type: 'account_onboarding',
  });

  return { url: accountLink.url };
}

async function getPayoutStatus(userId) {
  const vendor = await resolveVendor(userId);
  const account = await vendorModel.findStripeAccountByVendorId(vendor.id);

  if (!account?.stripe_account_id) {
    return { connected: false, chargesEnabled: false, payoutsEnabled: false };
  }

  const stripeAccount = await stripe.accounts.retrieve(account.stripe_account_id);
  const chargesEnabled = Boolean(stripeAccount.charges_enabled);
  const payoutsEnabled = Boolean(stripeAccount.payouts_enabled);

  if (chargesEnabled !== account.stripe_charges_enabled || payoutsEnabled !== account.stripe_payouts_enabled) {
    await vendorModel.updateStripeAccount(vendor.id, {
      stripe_charges_enabled: chargesEnabled,
      stripe_payouts_enabled: payoutsEnabled,
    });
  }

  return { connected: true, chargesEnabled, payoutsEnabled };
}

async function handleAccountWebhookEvent(event) {
  if (event.type !== 'account.updated') {
    return;
  }

  const stripeAccount = event.data.object;
  const vendor = await vendorModel.findByStripeAccountId(stripeAccount.id);
  if (!vendor) {
    return;
  }

  await vendorModel.updateStripeAccount(vendor.id, {
    stripe_charges_enabled: Boolean(stripeAccount.charges_enabled),
    stripe_payouts_enabled: Boolean(stripeAccount.payouts_enabled),
  });
}

module.exports = { startOnboarding, getPayoutStatus, handleAccountWebhookEvent };
