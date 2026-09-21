const supabase = require('../config/supabase');
const AppError = require('../utils/AppError');

const SAVED_SERVICE_COLUMNS = 'id, user_id, service_id, created_at';

async function findOne(user_id, service_id) {
  const { data, error } = await supabase
    .from('saved_services')
    .select(SAVED_SERVICE_COLUMNS)
    .eq('user_id', user_id)
    .eq('service_id', service_id)
    .maybeSingle();

  if (error) {
    throw new AppError(500, error.message || 'Unable to look up saved service.');
  }

  return data;
}

async function create(user_id, service_id) {
  const { data, error } = await supabase
    .from('saved_services')
    .insert({ user_id, service_id })
    .select(SAVED_SERVICE_COLUMNS)
    .single();

  if (error) {
    if (error.code === '23505') {
      // Already saved — treat as success and hand back the existing row.
      return findOne(user_id, service_id);
    }
    throw new AppError(500, error.message || 'Unable to save service.');
  }

  return data;
}

async function remove(user_id, service_id) {
  const { error } = await supabase
    .from('saved_services')
    .delete()
    .eq('user_id', user_id)
    .eq('service_id', service_id);

  if (error) {
    throw new AppError(500, error.message || 'Unable to remove saved service.');
  }
}

async function listByUserId(user_id) {
  const { data, error } = await supabase
    .from('saved_services')
    .select(
      `${SAVED_SERVICE_COLUMNS}, services(id, service_name, service_category, starting_price, vendor_id, vendors(id, company_name, profile_image, cover_image))`
    )
    .eq('user_id', user_id)
    .order('created_at', { ascending: false });

  if (error) {
    throw new AppError(500, error.message || 'Unable to list saved services.');
  }

  return data;
}

async function listServiceIdsByUserId(user_id) {
  const { data, error } = await supabase.from('saved_services').select('service_id').eq('user_id', user_id);

  if (error) {
    throw new AppError(500, error.message || 'Unable to list saved service ids.');
  }

  return data.map((row) => row.service_id);
}

module.exports = { create, remove, listByUserId, listServiceIdsByUserId };
