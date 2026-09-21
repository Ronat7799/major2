const supabase = require('../config/supabase');
const AppError = require('../utils/AppError');

const SERVICE_COLUMNS =
  'id, vendor_id, service_name, service_category, starting_price, minimum_guest_capacity, maximum_guest_capacity, estimated_setup_time, service_description, availability, created_at, updated_at';

async function createService({
  vendor_id,
  service_name,
  service_category,
  starting_price,
  minimum_guest_capacity,
  maximum_guest_capacity,
  estimated_setup_time,
  service_description,
  availability,
}) {
  const { data, error } = await supabase
    .from('services')
    .insert({
      vendor_id,
      service_name,
      service_category,
      starting_price,
      minimum_guest_capacity,
      maximum_guest_capacity,
      estimated_setup_time,
      service_description,
      availability,
    })
    .select(SERVICE_COLUMNS)
    .single();

  if (error) {
    throw new AppError(500, error.message || 'Unable to create service.');
  }

  return data;
}

const SORT_OPTIONS = {
  newest: { column: 'created_at', ascending: false },
  oldest: { column: 'created_at', ascending: true },
  name_asc: { column: 'service_name', ascending: true },
  name_desc: { column: 'service_name', ascending: false },
  price_asc: { column: 'starting_price', ascending: true },
  price_desc: { column: 'starting_price', ascending: false },
};

async function listByVendorId(vendor_id, { search, category, status, sort, page, pageSize } = {}) {
  let query = supabase
    .from('services')
    .select(SERVICE_COLUMNS, { count: 'exact' })
    .eq('vendor_id', vendor_id);

  if (search) {
    query = query.ilike('service_name', `%${search}%`);
  }
  if (category) {
    query = query.eq('service_category', category);
  }
  if (status) {
    query = query.eq('availability', status);
  }

  const { column, ascending } = SORT_OPTIONS[sort] || SORT_OPTIONS.newest;
  query = query.order(column, { ascending });

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  query = query.range(from, to);

  const { data, error, count } = await query;

  if (error) {
    throw new AppError(500, error.message || 'Unable to list services.');
  }

  return { services: data, total: count ?? 0 };
}

async function findActiveByVendorIds(vendorIds, { category, minPrice, maxPrice } = {}) {
  if (!vendorIds.length) {
    return [];
  }

  let query = supabase
    .from('services')
    .select('id, vendor_id, service_name, service_category, service_description, starting_price, created_at')
    .in('vendor_id', vendorIds)
    .eq('availability', 'Active');

  if (category) {
    query = query.eq('service_category', category);
  }
  if (minPrice !== undefined && minPrice !== null) {
    query = query.gte('starting_price', minPrice);
  }
  if (maxPrice !== undefined && maxPrice !== null) {
    query = query.lt('starting_price', maxPrice);
  }

  const { data, error } = await query;

  if (error) {
    throw new AppError(500, error.message || 'Unable to list services.');
  }

  return data;
}

async function findById(id) {
  const { data, error } = await supabase
    .from('services')
    .select(SERVICE_COLUMNS)
    .eq('id', id)
    .maybeSingle();

  if (error) {
    throw new AppError(500, error.message || 'Unable to look up service.');
  }

  return data;
}

async function updateById(id, fields) {
  const { data, error } = await supabase
    .from('services')
    .update(fields)
    .eq('id', id)
    .select(SERVICE_COLUMNS)
    .single();

  if (error) {
    throw new AppError(500, error.message || 'Unable to update service.');
  }

  return data;
}

async function deleteById(id) {
  const { error } = await supabase.from('services').delete().eq('id', id);

  if (error) {
    throw new AppError(500, error.message || 'Unable to delete service.');
  }
}

module.exports = {
  createService,
  listByVendorId,
  findActiveByVendorIds,
  findById,
  updateById,
  deleteById,
};
