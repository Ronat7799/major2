const supabase = require('../config/supabase');
const AppError = require('../utils/AppError');

function isMissingColumnError(error) {
  return error?.code === '42703' || error?.code === 'PGRST204';
}

async function createBooking(fields) {
  let { data, error } = await supabase
    .from('bookings')
    .insert(fields)
    .select(
      'id, quotation_id, vendor_id, user_id, booking_date, start_time, end_time, status, deposit_due_at, created_at, updated_at'
    )
    .single();

  if (error && isMissingColumnError(error)) {
    const { deposit_due_at, ...baseFields } = fields;
    ({ data, error } = await supabase
      .from('bookings')
      .insert(baseFields)
      .select('id, quotation_id, vendor_id, user_id, booking_date, start_time, end_time, status, created_at, updated_at')
      .single());
  }

  if (error) {
    throw new AppError(500, error.message || 'Unable to create booking.');
  }

  return data;
}

async function findById(id) {
  let { data, error } = await supabase
    .from('bookings')
    .select('id, quotation_id, vendor_id, user_id, booking_date, start_time, end_time, status, deposit_due_at, created_at, updated_at')
    .eq('id', id)
    .maybeSingle();

  if (error && isMissingColumnError(error)) {
    ({ data, error } = await supabase
      .from('bookings')
      .select('id, quotation_id, vendor_id, user_id, booking_date, start_time, end_time, status, created_at, updated_at')
      .eq('id', id)
      .maybeSingle());
  }

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
  let { data, error } = await supabase
    .from('bookings')
    .select(
      'id, quotation_id, vendor_id, user_id, booking_date, start_time, end_time, status, deposit_due_at, created_at, updated_at, vendors(company_name, profile_image, business_category)'
    )
    .eq('user_id', user_id)
    .order('created_at', { ascending: false });

  if (error && isMissingColumnError(error)) {
    ({ data, error } = await supabase
      .from('bookings')
      .select(
        'id, quotation_id, vendor_id, user_id, booking_date, start_time, end_time, status, created_at, updated_at, vendors(company_name, profile_image, business_category)'
      )
      .eq('user_id', user_id)
      .order('created_at', { ascending: false }));
  }

  if (error) {
    throw new AppError(500, error.message || 'Unable to list bookings.');
  }

  return data;
}

async function findByIdForUser(id, user_id) {
  let { data, error } = await supabase
    .from('bookings')
    .select(
      'id, quotation_id, vendor_id, user_id, booking_date, start_time, end_time, status, deposit_due_at, cancellation_reason, created_at, updated_at, vendors(company_name, profile_image, business_category, business_address, created_at)'
    )
    .eq('id', id)
    .eq('user_id', user_id)
    .maybeSingle();

  if (error && isMissingColumnError(error)) {
    ({ data, error } = await supabase
      .from('bookings')
      .select(
        'id, quotation_id, vendor_id, user_id, booking_date, start_time, end_time, status, created_at, updated_at, vendors(company_name, profile_image, business_category, business_address, created_at)'
      )
      .eq('id', id)
      .eq('user_id', user_id)
      .maybeSingle());
  }

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

async function findOverdueDepositBookings() {
  const { data, error } = await supabase
    .from('bookings')
    .select('id, quotation_id')
    .eq('status', 'confirmed')
    .not('deposit_due_at', 'is', null)
    .lte('deposit_due_at', new Date().toISOString());

  if (error) {
    if (isMissingColumnError(error)) {
      return [];
    }
    throw new AppError(500, error.message || 'Unable to check overdue deposits.');
  }

  return data || [];
}

async function declineBookingForDepositTimeout(id) {
  const { data, error } = await supabase
    .from('bookings')
    .update({
      status: 'declined',
      cancellation_reason: 'The deposit was not paid within 24 hours, so this booking was automatically declined.',
    })
    .eq('id', id)
    .select('id, quotation_id, vendor_id, user_id, booking_date, start_time, end_time, status, cancellation_reason, created_at, updated_at')
    .maybeSingle();

  if (error) {
    throw new AppError(500, error.message || 'Unable to decline booking.');
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
  findOverdueDepositBookings,
  declineBookingForDepositTimeout,
};
