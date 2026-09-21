const supabase = require('../config/supabase');
const AppError = require('../utils/AppError');

async function findByVendorId(vendor_id) {
  const { data, error } = await supabase
    .from('reviews')
    .select('id, rating, comment, created_at, users(full_name)')
    .eq('vendor_id', vendor_id)
    .order('created_at', { ascending: false });

  if (error) {
    throw new AppError(500, error.message || 'Unable to load reviews.');
  }

  return data;
}

// Bulk lookup for list pages (Browse Vendors) — one query for every vendor's
// reviews instead of one query per vendor. Callers group by vendor_id
// themselves, same pattern as serviceModel.findActiveByVendorIds.
async function findByVendorIds(vendor_ids) {
  if (!vendor_ids.length) {
    return [];
  }

  const { data, error } = await supabase.from('reviews').select('id, vendor_id, rating').in('vendor_id', vendor_ids);

  if (error) {
    throw new AppError(500, error.message || 'Unable to load reviews.');
  }

  return data;
}

async function createReview(fields) {
  const { data, error } = await supabase
    .from('reviews')
    .insert(fields)
    .select('id, booking_id, user_id, vendor_id, rating, comment, created_at')
    .single();

  if (error) {
    if (error.code === '23505') {
      throw new AppError(409, 'You have already reviewed this booking.');
    }
    throw new AppError(500, error.message || 'Unable to submit review.');
  }

  return data;
}

module.exports = { findByVendorId, findByVendorIds, createReview };
