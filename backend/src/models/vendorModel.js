const supabase = require('../config/supabase');
const AppError = require('../utils/AppError');

const VENDOR_PROFILE_COLUMNS =
  'id, user_id, company_name, contact_person, business_category, business_address, business_description, year_of_experience, profile_image, cover_image, full_address, latitude, longitude, languages_spoken, created_at, updated_at';

async function createVendor({
  user_id,
  company_name,
  contact_person,
  business_category,
  business_address,
}) {
  const { data, error } = await supabase
    .from('vendors')
    .insert({
      user_id,
      company_name,
      contact_person,
      business_category,
      business_address,
    })
    .select('id, user_id, company_name')
    .single();

  if (error) {
    throw new AppError(500, error.message || 'Unable to create vendor profile.');
  }

  return data;
}

async function findByUserId(user_id) {
  const { data, error } = await supabase
    .from('vendors')
    .select(VENDOR_PROFILE_COLUMNS)
    .eq('user_id', user_id)
    .maybeSingle();

  if (error) {
    throw new AppError(500, error.message || 'Unable to look up vendor profile.');
  }

  return data;
}

async function findById(id) {
  const { data, error } = await supabase
    .from('vendors')
    .select(VENDOR_PROFILE_COLUMNS)
    .eq('id', id)
    .maybeSingle();

  if (error) {
    throw new AppError(500, error.message || 'Unable to look up vendor profile.');
  }

  return data;
}

async function createEmptyForUser(user_id) {
  const { data, error } = await supabase
    .from('vendors')
    .insert({ user_id, company_name: '' })
    .select(VENDOR_PROFILE_COLUMNS)
    .single();

  if (error) {
    throw new AppError(500, error.message || 'Unable to initialize vendor profile.');
  }

  return data;
}

async function updateByUserId(user_id, fields) {
  const { data, error } = await supabase
    .from('vendors')
    .update(fields)
    .eq('user_id', user_id)
    .select(VENDOR_PROFILE_COLUMNS)
    .single();

  if (error) {
    throw new AppError(500, error.message || 'Unable to update vendor profile.');
  }

  return data;
}

const STRIPE_ACCOUNT_COLUMNS = 'id, user_id, stripe_account_id, stripe_charges_enabled, stripe_payouts_enabled';

async function findStripeAccountByVendorId(vendorId) {
  const { data, error } = await supabase
    .from('vendors')
    .select(STRIPE_ACCOUNT_COLUMNS)
    .eq('id', vendorId)
    .maybeSingle();

  if (error) {
    throw new AppError(500, error.message || 'Unable to look up vendor payout account.');
  }

  return data;
}

async function findByStripeAccountId(stripeAccountId) {
  const { data, error } = await supabase
    .from('vendors')
    .select(STRIPE_ACCOUNT_COLUMNS)
    .eq('stripe_account_id', stripeAccountId)
    .maybeSingle();

  if (error) {
    throw new AppError(500, error.message || 'Unable to look up vendor by Stripe account.');
  }

  return data;
}

async function updateStripeAccount(vendorId, fields) {
  const { data, error } = await supabase
    .from('vendors')
    .update(fields)
    .eq('id', vendorId)
    .select(STRIPE_ACCOUNT_COLUMNS)
    .single();

  if (error) {
    throw new AppError(500, error.message || 'Unable to update vendor payout account.');
  }

  return data;
}

async function listCompletedProfiles({ location } = {}) {
  let query = supabase
    .from('vendors')
    .select('id, company_name, business_category, business_description, business_address, profile_image, cover_image')
    .neq('company_name', '');

  if (location) {
    query = query.eq('business_address', location);
  }

  const { data, error } = await query;

  if (error) {
    throw new AppError(500, error.message || 'Unable to list vendors.');
  }

  return data;
}

module.exports = {
  createVendor,
  findByUserId,
  findById,
  createEmptyForUser,
  updateByUserId,
  listCompletedProfiles,
  findStripeAccountByVendorId,
  findByStripeAccountId,
  updateStripeAccount,
};
