const supabase = require('../config/supabase');
const AppError = require('../utils/AppError');

async function createImage({ service_id, image_url }) {
  const { data, error } = await supabase
    .from('portfolio')
    .insert({ service_id, image_url })
    .select('id, service_id, image_url, created_at')
    .single();

  if (error) {
    throw new AppError(500, error.message || 'Unable to save service image.');
  }

  return data;
}

async function findByServiceId(service_id) {
  const { data, error } = await supabase
    .from('portfolio')
    .select('id, service_id, image_url, created_at')
    .eq('service_id', service_id)
    .order('created_at', { ascending: true });

  if (error) {
    throw new AppError(500, error.message || 'Unable to load service images.');
  }

  return data;
}

async function findByServiceIds(serviceIds) {
  if (!serviceIds.length) {
    return [];
  }

  const { data, error } = await supabase
    .from('portfolio')
    .select('id, service_id, image_url, created_at')
    .in('service_id', serviceIds)
    .order('created_at', { ascending: true });

  if (error) {
    throw new AppError(500, error.message || 'Unable to load service images.');
  }

  return data;
}

async function deleteByIds(service_id, ids) {
  if (!ids.length) {
    return;
  }

  const { error } = await supabase.from('portfolio').delete().eq('service_id', service_id).in('id', ids);

  if (error) {
    throw new AppError(500, error.message || 'Unable to remove service images.');
  }
}

module.exports = { createImage, findByServiceId, findByServiceIds, deleteByIds };
