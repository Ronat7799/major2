const supabase = require('../config/supabase');
const AppError = require('../utils/AppError');

const BASE_USER_COLUMNS = 'id, full_name, email, phone, password, role, notifications_last_read_at, created_at, updated_at';
const USER_COLUMNS = `${BASE_USER_COLUMNS}, profile_image`;

function isMissingColumnError(error) {
  return error?.code === '42703';
}

function throwIfError(error, fallbackMessage) {
  if (!error) {
    return;
  }

  if (error.code === '23505') {
    throw new AppError(409, 'An account with this email already exists.');
  }

  throw new AppError(500, error.message || fallbackMessage);
}

async function findByEmail(email) {
  let { data, error } = await supabase.from('users').select(USER_COLUMNS).eq('email', email).maybeSingle();

  if (error && isMissingColumnError(error)) {
    ({ data, error } = await supabase.from('users').select(BASE_USER_COLUMNS).eq('email', email).maybeSingle());
  }

  throwIfError(error, 'Unable to look up user.');
  return data;
}

async function findById(id) {
  let { data, error } = await supabase.from('users').select(USER_COLUMNS).eq('id', id).maybeSingle();

  if (error && isMissingColumnError(error)) {
    ({ data, error } = await supabase.from('users').select(BASE_USER_COLUMNS).eq('id', id).maybeSingle());
  }

  throwIfError(error, 'Unable to look up user.');
  return data;
}

async function createUser({ full_name, email, phone, password, role }) {
  const { data, error } = await supabase
    .from('users')
    .insert({
      full_name,
      email,
      phone,
      password,
      role,
    })
    .select(USER_COLUMNS)
    .single();

  throwIfError(error, 'Unable to create user.');
  return data;
}

async function updateContactInfo(id, { full_name, phone }) {
  const { data, error } = await supabase
    .from('users')
    .update({ full_name, phone })
    .eq('id', id)
    .select(USER_COLUMNS)
    .maybeSingle();

  throwIfError(error, 'Unable to update account contact info.');
  return data;
}

async function updatePassword(id, password) {
  const { data, error } = await supabase
    .from('users')
    .update({ password })
    .eq('id', id)
    .select(USER_COLUMNS)
    .maybeSingle();

  throwIfError(error, 'Unable to update password.');
  return data;
}

async function updateProfileImage(id, profile_image) {
  const { data, error } = await supabase
    .from('users')
    .update({ profile_image })
    .eq('id', id)
    .select(USER_COLUMNS)
    .maybeSingle();

  throwIfError(error, 'Unable to update profile photo.');
  return data;
}

async function deleteById(id) {
  const { error } = await supabase.from('users').delete().eq('id', id);
  throwIfError(error, 'Unable to roll back user.');
}

async function markNotificationsRead(id) {
  const { data, error } = await supabase
    .from('users')
    .update({ notifications_last_read_at: new Date().toISOString() })
    .eq('id', id)
    .select(USER_COLUMNS)
    .maybeSingle();

  throwIfError(error, 'Unable to update notification read state.');
  return data;
}

module.exports = {
  findByEmail,
  findById,
  createUser,
  updateContactInfo,
  updatePassword,
  updateProfileImage,
  deleteById,
  markNotificationsRead,
};
