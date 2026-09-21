const supabase = require('../config/supabase');
const AppError = require('../utils/AppError');

async function createBooking(fields) {
  const { data, error } = await supabase
    .from('bookings')
    .insert(fields)
    .select('id, quotation_id, vendor_id, user_id, booking_date, start_time, end_time, status, created_at, updated_at')
    .single();

  if (error) {
    throw new AppError(500, error.message || 'Unable to create booking.');
  }

  return data;
}

// Unscoped lookup — the caller is responsible for any ownership check;
// used by paymentService, which only needs the booking's quotation_id and
// has no notion of "for this customer/vendor" itself.
async function findById(id) {
  const { data, error } = await supabase
    .from('bookings')
    .select('id, quotation_id, vendor_id, user_id, booking_date, start_time, end_time, status, created_at, updated_at')
    .eq('id', id)
    .maybeSingle();

  if (error) {
    throw new AppError(500, error.message || 'Unable to load booking.');
  }

  return data;
}

async function findByQuotationId(quotation_id) {
  const { data, error } = await supabase
    .from('bookings')
    .select('id, quotation_id, vendor_id, user_id, booking_date, start_time, end_time, status, created_at, updated_at')
    .eq('quotation_id', quotation_id)
    .maybeSingle();

  if (error) {
    throw new AppError(500, error.message || 'Unable to look up booking.');
  }

  return data;
}

async function countCompletedByVendorId(vendor_id) {
  const { count, error } = await supabase
    .from('bookings')
    .select('id', { count: 'exact', head: true })
    .eq('vendor_id', vendor_id)
    .eq('status', 'completed');

  if (error) {
    throw new AppError(500, error.message || 'Unable to count bookings.');
  }

  return count || 0;
}

async function listByUserId(user_id) {
  const { data, error } = await supabase
    .from('bookings')
    .select(
      'id, quotation_id, vendor_id, user_id, booking_date, start_time, end_time, status, created_at, updated_at, vendors(company_name, profile_image, business_category)'
    )
    .eq('user_id', user_id)
    .order('created_at', { ascending: false });

  if (error) {
    throw new AppError(500, error.message || 'Unable to list bookings.');
  }

  return data;
}

async function findByIdForUser(id, user_id) {
  const { data, error } = await supabase
    .from('bookings')
    .select(
      'id, quotation_id, vendor_id, user_id, booking_date, start_time, end_time, status, created_at, updated_at, vendors(company_name, profile_image, business_category, business_address, created_at)'
    )
    .eq('id', id)
    .eq('user_id', user_id)
    .maybeSingle();

  if (error) {
    throw new AppError(500, error.message || 'Unable to load booking.');
  }

  return data;
}

async function listByVendorId(vendor_id) {
  const { data, error } = await supabase
    .from('bookings')
    .select(
      'id, quotation_id, vendor_id, user_id, booking_date, start_time, end_time, status, created_at, updated_at, users(full_name, email, phone)'
    )
    .eq('vendor_id', vendor_id)
    .order('created_at', { ascending: false });

  if (error) {
    throw new AppError(500, error.message || 'Unable to list bookings.');
  }

  return data;
}

async function findByIdForVendor(id, vendor_id) {
  const { data, error } = await supabase
    .from('bookings')
    .select(
      'id, quotation_id, vendor_id, user_id, booking_date, start_time, end_time, status, cancellation_reason, created_at, updated_at, users(full_name, email, phone, created_at)'
    )
    .eq('id', id)
    .eq('vendor_id', vendor_id)
    .maybeSingle();

  if (error) {
    throw new AppError(500, error.message || 'Unable to load booking.');
  }

  return data;
}

// Scoped to vendor_id so a vendor can only ever update their own booking —
// returns null (not an error) if the id doesn't exist or isn't theirs.
async function updateStatusForVendor(id, vendor_id, status) {
  const { data, error } = await supabase
    .from('bookings')
    .update({ status })
    .eq('id', id)
    .eq('vendor_id', vendor_id)
    .select('id, quotation_id, vendor_id, user_id, booking_date, start_time, end_time, status, created_at, updated_at')
    .maybeSingle();

  if (error) {
    throw new AppError(500, error.message || 'Unable to update booking status.');
  }

  return data;
}

// Scoped to vendor_id, same as updateStatusForVendor, but also records why.
async function cancelBookingForVendor(id, vendor_id, reason) {
  const { data, error } = await supabase
    .from('bookings')
    .update({ status: 'cancelled', cancellation_reason: reason })
    .eq('id', id)
    .eq('vendor_id', vendor_id)
    .select('id, quotation_id, vendor_id, user_id, booking_date, start_time, end_time, status, cancellation_reason, created_at, updated_at')
    .maybeSingle();

  if (error) {
    throw new AppError(500, error.message || 'Unable to cancel booking.');
  }

  return data;
}

// Deliberately minimal columns (no customer name/contact) — this backs a
// public availability check (which dates a vendor is already booked), so it
// must never leak who the other customer is, just that the slot is taken.
async function findConfirmedScheduleByVendorId(vendor_id) {
  const { data, error } = await supabase
    .from('bookings')
    .select('booking_date, start_time, end_time')
    .eq('vendor_id', vendor_id)
    .eq('status', 'confirmed');

  if (error) {
    throw new AppError(500, error.message || 'Unable to load vendor schedule.');
  }

  return data;
}

module.exports = {
  createBooking,
  findById,
  findByQuotationId,
  countCompletedByVendorId,
  listByUserId,
  findByIdForUser,
  listByVendorId,
  findByIdForVendor,
  updateStatusForVendor,
  cancelBookingForVendor,
  findConfirmedScheduleByVendorId,
};
