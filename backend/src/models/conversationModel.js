const supabase = require('../config/supabase');
const AppError = require('../utils/AppError');

const CONVERSATION_COLUMNS = 'id, booking_id, quotation_id, status, user_id, vendor_id, created_at, updated_at';
const BOOKING_JOIN = 'bookings(id, quotation_id, booking_date, start_time, end_time, status)';

async function createConversation(fields) {
  const { data, error } = await supabase
    .from('conversations')
    .insert(fields)
    .select(CONVERSATION_COLUMNS)
    .single();

  if (error) {
    if (error.code === '23505') {
      return findByBookingId(fields.booking_id);
    }
    throw new AppError(500, error.message || 'Unable to create conversation.');
  }

  return data;
}

async function findByBookingId(booking_id) {
  const { data, error } = await supabase
    .from('conversations')
    .select(CONVERSATION_COLUMNS)
    .eq('booking_id', booking_id)
    .maybeSingle();

  if (error) {
    throw new AppError(500, error.message || 'Unable to look up conversation.');
  }

  return data;
}

async function createInvite({ quotation_id, vendor_id, user_id }) {
  const { data, error } = await supabase
    .from('conversations')
    .insert({ quotation_id, vendor_id, user_id, booking_id: null, status: 'invited' })
    .select(CONVERSATION_COLUMNS)
    .single();

  if (error) {
    if (error.code === '23505') {
      const existing = await findByQuotationId(quotation_id);
      if (existing?.status === 'declined') {
        return updateStatus(existing.id, 'invited');
      }
      return existing;
    }
    throw new AppError(500, error.message || 'Unable to create chat invite.');
  }

  return data;
}

async function findByQuotationId(quotation_id) {
  const { data, error } = await supabase
    .from('conversations')
    .select(CONVERSATION_COLUMNS)
    .eq('quotation_id', quotation_id)
    .maybeSingle();

  if (error) {
    throw new AppError(500, error.message || 'Unable to look up chat invite.');
  }

  return data;
}

async function updateStatus(id, status) {
  const { data, error } = await supabase
    .from('conversations')
    .update({ status })
    .eq('id', id)
    .select(CONVERSATION_COLUMNS)
    .single();

  if (error) {
    throw new AppError(500, error.message || 'Unable to update conversation status.');
  }

  return data;
}

async function findById(id) {
  const { data, error } = await supabase
    .from('conversations')
    .select(`${CONVERSATION_COLUMNS}, vendors(company_name, profile_image), users(full_name), ${BOOKING_JOIN}`)
    .eq('id', id)
    .maybeSingle();

  if (error) {
    throw new AppError(500, error.message || 'Unable to look up conversation.');
  }

  return data;
}

async function listForCustomer(user_id) {
  const { data, error } = await supabase
    .from('conversations')
    .select(`${CONVERSATION_COLUMNS}, vendors(company_name, profile_image), ${BOOKING_JOIN}`)
    .eq('user_id', user_id)
    .order('updated_at', { ascending: false });

  if (error) {
    throw new AppError(500, error.message || 'Unable to list conversations.');
  }

  return data;
}

async function listForVendor(vendor_id) {
  const { data, error } = await supabase
    .from('conversations')
    .select(`${CONVERSATION_COLUMNS}, users(full_name), ${BOOKING_JOIN}`)
    .eq('vendor_id', vendor_id)
    .order('updated_at', { ascending: false });

  if (error) {
    throw new AppError(500, error.message || 'Unable to list conversations.');
  }

  return data;
}

async function touchUpdatedAt(id) {
  const { error } = await supabase
    .from('conversations')
    .update({ updated_at: new Date().toISOString() })
    .eq('id', id);

  if (error) {
    throw new AppError(500, error.message || 'Unable to update conversation.');
  }
}

module.exports = {
  createConversation,
  findByBookingId,
  createInvite,
  findByQuotationId,
  updateStatus,
  findById,
  listForCustomer,
  listForVendor,
  touchUpdatedAt,
};
