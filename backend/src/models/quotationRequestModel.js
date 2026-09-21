const supabase = require('../config/supabase');
const AppError = require('../utils/AppError');

const REQUEST_COLUMNS =
  'id, customer_id, vendor_id, event_type, event_date, start_time, end_time, event_location, guests_min, guests_max, budget_min, budget_max, additional_event_description, status, created_at, updated_at';

async function createRequest(fields) {
  const { data, error } = await supabase
    .from('quotation_requests')
    .insert(fields)
    .select(REQUEST_COLUMNS)
    .single();

  if (error) {
    if (error.code === '23505') {
      throw new AppError(409, 'You already have an active request with this vendor.');
    }
    throw new AppError(500, error.message || 'Unable to submit quotation request.');
  }

  return data;
}

async function createRequestServices(quotationRequestId, categories) {
  if (!categories.length) {
    return;
  }

  const rows = categories.map((service_category) => ({
    quotation_request_id: quotationRequestId,
    service_category,
  }));

  const { error } = await supabase.from('quotation_requests_services').insert(rows);

  if (error) {
    throw new AppError(500, error.message || 'Unable to save requested services.');
  }
}

async function createRequestImages(quotationRequestId, imageUrls) {
  if (!imageUrls.length) {
    return;
  }

  const rows = imageUrls.map((image_url) => ({
    quotation_request_id: quotationRequestId,
    image_url,
  }));

  const { error } = await supabase.from('quotation_requests_image').insert(rows);

  if (error) {
    throw new AppError(500, error.message || 'Unable to save inspiration images.');
  }
}

async function listByVendorId(vendor_id) {
  const { data, error } = await supabase
    .from('quotation_requests')
    .select(`${REQUEST_COLUMNS}, users(full_name)`)
    .eq('vendor_id', vendor_id)
    .order('created_at', { ascending: false });

  if (error) {
    throw new AppError(500, error.message || 'Unable to list quotation requests.');
  }

  return data;
}

async function findByIdForVendor(id, vendor_id) {
  const { data, error } = await supabase
    .from('quotation_requests')
    .select(`${REQUEST_COLUMNS}, users(full_name, email, phone, created_at)`)
    .eq('id', id)
    .eq('vendor_id', vendor_id)
    .maybeSingle();

  if (error) {
    throw new AppError(500, error.message || 'Unable to load quotation request.');
  }

  return data;
}

async function findServicesByRequestId(quotation_request_id) {
  const { data, error } = await supabase
    .from('quotation_requests_services')
    .select('id, service_category')
    .eq('quotation_request_id', quotation_request_id);

  if (error) {
    throw new AppError(500, error.message || 'Unable to load requested services.');
  }

  return data;
}

async function findImagesByRequestId(quotation_request_id) {
  const { data, error } = await supabase
    .from('quotation_requests_image')
    .select('id, image_url, created_at')
    .eq('quotation_request_id', quotation_request_id)
    .order('created_at', { ascending: true });

  if (error) {
    throw new AppError(500, error.message || 'Unable to load inspiration images.');
  }

  return data;
}

async function findById(id) {
  const { data, error } = await supabase
    .from('quotation_requests')
    .select(`${REQUEST_COLUMNS}, vendors(company_name, profile_image, business_address)`)
    .eq('id', id)
    .maybeSingle();

  if (error) {
    throw new AppError(500, error.message || 'Unable to load quotation request.');
  }

  return data;
}

async function findByIds(ids) {
  if (!ids.length) {
    return [];
  }

  const { data, error } = await supabase.from('quotation_requests').select(REQUEST_COLUMNS).in('id', ids);

  if (error) {
    throw new AppError(500, error.message || 'Unable to list quotation requests.');
  }

  return data;
}

async function listByCustomerId(customer_id) {
  const { data, error } = await supabase
    .from('quotation_requests')
    .select(`${REQUEST_COLUMNS}, vendors(company_name, profile_image)`)
    .eq('customer_id', customer_id)
    .order('created_at', { ascending: false });

  if (error) {
    throw new AppError(500, error.message || 'Unable to list quotation requests.');
  }

  return data;
}

async function updateStatus(id, status) {
  const { data, error } = await supabase
    .from('quotation_requests')
    .update({ status })
    .eq('id', id)
    .select(REQUEST_COLUMNS)
    .maybeSingle();

  if (error) {
    throw new AppError(500, error.message || 'Unable to update quotation request status.');
  }

  return data;
}

module.exports = {
  createRequest,
  createRequestServices,
  createRequestImages,
  listByVendorId,
  findByIdForVendor,
  findServicesByRequestId,
  findImagesByRequestId,
  findById,
  findByIds,
  listByCustomerId,
  updateStatus,
};
