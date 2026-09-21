const supabase = require('../config/supabase');
const AppError = require('../utils/AppError');

const COLUMNS =
  'id, booking_id, amount, payment_method, transaction_id, payment_status, payment_type, paid_at, created_at, updated_at';

// Idempotent create, mirroring conversationModel.createInvite: a unique
// violation on (booking_id, payment_type) means a concurrent request beat
// us to it — re-fetch and hand back the row that already exists instead
// of erroring.
async function createPayment(fields) {
  const { data, error } = await supabase.from('payments').insert(fields).select(COLUMNS).single();

  if (error) {
    if (error.code === '23505') {
      return findByBookingIdAndType(fields.booking_id, fields.payment_type);
    }
    throw new AppError(500, error.message || 'Unable to create payment.');
  }

  return data;
}

// The "does this stage already have a row for this booking" lookup used
// inside intent creation — one row max per (booking_id, payment_type).
async function findByBookingIdAndType(booking_id, payment_type) {
  const { data, error } = await supabase
    .from('payments')
    .select(COLUMNS)
    .eq('booking_id', booking_id)
    .eq('payment_type', payment_type)
    .maybeSingle();

  if (error) {
    throw new AppError(500, error.message || 'Unable to look up payment.');
  }

  return data;
}

// All payment rows for one booking (0-2 today: deposit/balance, or a
// single legacy 'full' row) — powers the payment summary/history reads.
async function findAllByBookingId(booking_id) {
  const { data, error } = await supabase
    .from('payments')
    .select(COLUMNS)
    .eq('booking_id', booking_id)
    .order('created_at', { ascending: true });

  if (error) {
    throw new AppError(500, error.message || 'Unable to list payments.');
  }

  return data;
}

// Bulk lookup for list pages — returns ALL rows per booking (up to 2 today).
// Callers must group by booking_id themselves rather than assume 1:1.
async function findByBookingIds(booking_ids) {
  if (!booking_ids.length) {
    return [];
  }

  const { data, error } = await supabase.from('payments').select(COLUMNS).in('booking_id', booking_ids);

  if (error) {
    throw new AppError(500, error.message || 'Unable to list payments.');
  }

  return data;
}

async function findByTransactionId(transaction_id) {
  const { data, error } = await supabase.from('payments').select(COLUMNS).eq('transaction_id', transaction_id).maybeSingle();

  if (error) {
    throw new AppError(500, error.message || 'Unable to look up payment.');
  }

  return data;
}

async function updateByTransactionId(transaction_id, fields) {
  const { data, error } = await supabase
    .from('payments')
    .update(fields)
    .eq('transaction_id', transaction_id)
    .select(COLUMNS)
    .maybeSingle();

  if (error) {
    throw new AppError(500, error.message || 'Unable to update payment.');
  }

  return data;
}

module.exports = {
  createPayment,
  findByBookingIdAndType,
  findAllByBookingId,
  findByBookingIds,
  findByTransactionId,
  updateByTransactionId,
};
