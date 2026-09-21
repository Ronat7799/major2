const supabase = require('../config/supabase');
const AppError = require('../utils/AppError');

const BASE_COLUMNS =
  'id, quotation_request_id, vendor_id, service_subtotal, additional_charges, platform_fee, grand_total, service_message, status, created_at, updated_at';
const QUOTATION_COLUMNS = `${BASE_COLUMNS}, parent_quotation_id, revision_number, revision_note, revised_at, expires_at`;

// The revision columns (migration 20260913000000) may not exist yet on a
// database that hasn't been migrated — falling back to the base columns lets
// every pre-existing quotation feature (create, list, accept, decline, view)
// keep working in that case; only the new revision-specific behavior needs
// the migration to actually be applied.
function isMissingColumnError(error) {
  return error?.code === '42703';
}

async function createQuotation(fields) {
  let { data, error } = await supabase.from('quotation').insert(fields).select(QUOTATION_COLUMNS).single();

  if (error && isMissingColumnError(error)) {
    ({ data, error } = await supabase.from('quotation').insert(fields).select(BASE_COLUMNS).single());
  }

  if (error) {
    if (error.code === '23505') {
      throw new AppError(409, 'A quotation has already been sent for this request.');
    }
    throw new AppError(500, error.message || 'Unable to create quotation.');
  }

  return data;
}

async function createQuotationItems(quotation_id, items) {
  if (!items.length) {
    return;
  }

  const rows = items.map((item) => ({
    quotation_id,
    service_id: item.service_id || null,
    service_name: item.service_name,
    quantity: item.quantity,
    unit_price: item.unit_price,
    total_price: item.total_price,
    description: item.description || null,
  }));

  let { error } = await supabase.from('quotation_items').insert(rows);

  // service_id (migration 20260919000000) may not exist yet — fall back to
  // the pre-migration columns so quotation creation itself never breaks
  // waiting on it; the Top Services ranking just won't have data until the
  // migration runs.
  if (error && isMissingColumnError(error)) {
    ({ error } = await supabase.from('quotation_items').insert(rows.map(({ service_id, ...rest }) => rest)));
  }

  if (error) {
    throw new AppError(500, error.message || 'Unable to save quotation items.');
  }
}

async function createAdditionalCharges(quotation_id, charges) {
  if (!charges.length) {
    return;
  }

  const rows = charges.map((charge) => ({
    quotation_id,
    charge_name: charge.charge_name,
    charge_price: charge.charge_price,
  }));

  const { error } = await supabase.from('quotation_additional_charges').insert(rows);

  if (error) {
    throw new AppError(500, error.message || 'Unable to save additional charges.');
  }
}

async function findByRequestIds(quotation_request_ids) {
  if (!quotation_request_ids.length) {
    return [];
  }

  let { data, error } = await supabase
    .from('quotation')
    .select(QUOTATION_COLUMNS)
    .in('quotation_request_id', quotation_request_ids);

  if (error && isMissingColumnError(error)) {
    ({ data, error } = await supabase
      .from('quotation')
      .select(BASE_COLUMNS)
      .in('quotation_request_id', quotation_request_ids));
  }

  if (error) {
    throw new AppError(500, error.message || 'Unable to list quotations.');
  }

  return data;
}

// A request can now have a chain of quotations (revisions kept as history
// rows instead of being overwritten) — this returns only the newest one,
// which is what every existing caller actually wants.
async function findByRequestId(quotation_request_id) {
  let { data, error } = await supabase
    .from('quotation')
    .select(QUOTATION_COLUMNS)
    .eq('quotation_request_id', quotation_request_id)
    .order('revision_number', { ascending: false })
    .limit(1);

  if (error && isMissingColumnError(error)) {
    ({ data, error } = await supabase
      .from('quotation')
      .select(BASE_COLUMNS)
      .eq('quotation_request_id', quotation_request_id)
      .order('created_at', { ascending: false })
      .limit(1));
  }

  if (error) {
    throw new AppError(500, error.message || 'Unable to look up quotation.');
  }

  return data?.[0] || null;
}

// Every quotation for a request, oldest first — the full revision chain.
async function findChainByRequestId(quotation_request_id) {
  let { data, error } = await supabase
    .from('quotation')
    .select(QUOTATION_COLUMNS)
    .eq('quotation_request_id', quotation_request_id)
    .order('revision_number', { ascending: true });

  if (error && isMissingColumnError(error)) {
    ({ data, error } = await supabase
      .from('quotation')
      .select(BASE_COLUMNS)
      .eq('quotation_request_id', quotation_request_id)
      .order('created_at', { ascending: true }));
  }

  if (error) {
    throw new AppError(500, error.message || 'Unable to load quotation history.');
  }

  return data;
}

async function updateStatus(id, status) {
  let { data, error } = await supabase
    .from('quotation')
    .update({ status })
    .eq('id', id)
    .select(QUOTATION_COLUMNS)
    .maybeSingle();

  if (error && isMissingColumnError(error)) {
    ({ data, error } = await supabase.from('quotation').update({ status }).eq('id', id).select(BASE_COLUMNS).maybeSingle());
  }

  if (error) {
    throw new AppError(500, error.message || 'Unable to update quotation status.');
  }

  return data;
}

async function markRevisionRequested(id, note) {
  const { data, error } = await supabase
    .from('quotation')
    .update({ status: 'revision_requested', revision_note: note || null })
    .eq('id', id)
    .select(QUOTATION_COLUMNS)
    .maybeSingle();

  if (error) {
    throw new AppError(500, error.message || 'Unable to request changes for this quotation.');
  }

  return data;
}

async function markRevised(id) {
  const { data, error } = await supabase
    .from('quotation')
    .update({ status: 'revised', revised_at: new Date().toISOString() })
    .eq('id', id)
    .select(QUOTATION_COLUMNS)
    .maybeSingle();

  if (error) {
    throw new AppError(500, error.message || 'Unable to update quotation status.');
  }

  return data;
}

async function findById(id) {
  let { data, error } = await supabase.from('quotation').select(QUOTATION_COLUMNS).eq('id', id).maybeSingle();

  if (error && isMissingColumnError(error)) {
    ({ data, error } = await supabase.from('quotation').select(BASE_COLUMNS).eq('id', id).maybeSingle());
  }

  if (error) {
    throw new AppError(500, error.message || 'Unable to look up quotation.');
  }

  return data;
}

async function findByIds(ids) {
  if (!ids.length) {
    return [];
  }

  let { data, error } = await supabase.from('quotation').select(QUOTATION_COLUMNS).in('id', ids);

  if (error && isMissingColumnError(error)) {
    ({ data, error } = await supabase.from('quotation').select(BASE_COLUMNS).in('id', ids));
  }

  if (error) {
    throw new AppError(500, error.message || 'Unable to list quotations.');
  }

  return data;
}

async function findItemsByQuotationId(quotation_id) {
  let { data, error } = await supabase
    .from('quotation_items')
    .select('id, service_id, service_name, quantity, unit_price, total_price, description')
    .eq('quotation_id', quotation_id);

  if (error && isMissingColumnError(error)) {
    ({ data, error } = await supabase
      .from('quotation_items')
      .select('id, service_name, quantity, unit_price, total_price, description')
      .eq('quotation_id', quotation_id));
  }

  if (error) {
    throw new AppError(500, error.message || 'Unable to load quotation items.');
  }

  return data;
}

// Batched form of findItemsByQuotationId — used by the vendor dashboard's Top
// Services ranking, which needs items across every booked quotation at once.
async function findItemsByQuotationIds(quotation_ids) {
  if (!quotation_ids.length) {
    return [];
  }

  let { data, error } = await supabase
    .from('quotation_items')
    .select('id, quotation_id, service_id, service_name, quantity, unit_price, total_price, description')
    .in('quotation_id', quotation_ids);

  if (error && isMissingColumnError(error)) {
    ({ data, error } = await supabase
      .from('quotation_items')
      .select('id, quotation_id, service_name, quantity, unit_price, total_price, description')
      .in('quotation_id', quotation_ids));
  }

  if (error) {
    throw new AppError(500, error.message || 'Unable to load quotation items.');
  }

  return data;
}

async function findChargesByQuotationId(quotation_id) {
  const { data, error } = await supabase
    .from('quotation_additional_charges')
    .select('id, charge_name, charge_price')
    .eq('quotation_id', quotation_id);

  if (error) {
    throw new AppError(500, error.message || 'Unable to load additional charges.');
  }

  return data;
}

// Recent quotations for a vendor in a given status, with the customer's
// name pulled through the parent quotation_requests row — used by the
// Recent Activity feeds (vendor dashboard: 'accepted'; quotation requests
// page: 'accepted' and 'revision_requested').
async function listByVendorIdAndStatus(vendor_id, status, limit = 10) {
  const { data, error } = await supabase
    .from('quotation')
    .select('id, vendor_id, status, updated_at, quotation_requests(id, customer_id, users(full_name))')
    .eq('vendor_id', vendor_id)
    .eq('status', status)
    .order('updated_at', { ascending: false })
    .limit(limit);

  if (error) {
    throw new AppError(500, error.message || 'Unable to list quotations.');
  }

  return data;
}

module.exports = {
  createQuotation,
  createQuotationItems,
  createAdditionalCharges,
  findByRequestId,
  findByRequestIds,
  findChainByRequestId,
  findById,
  findByIds,
  findItemsByQuotationId,
  findItemsByQuotationIds,
  findChargesByQuotationId,
  updateStatus,
  markRevisionRequested,
  markRevised,
  listByVendorIdAndStatus,
};
