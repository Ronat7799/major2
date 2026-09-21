const bcrypt = require('bcryptjs');
const userModel = require('../models/userModel');
const vendorModel = require('../models/vendorModel');
const AppError = require('../utils/AppError');
const { signAuthToken } = require('../utils/token');
const { toPublicUser } = require('../utils/userView');

const SALT_ROUNDS = 12;

function normalizeEmail(email) {
  return String(email).trim().toLowerCase();
}

function normalizePhone(phone) {
  if (!phone || !String(phone).trim()) {
    return null;
  }
  return String(phone).trim();
}

async function register({
  full_name,
  email,
  phone,
  password,
  confirm_password,
  role,
  company_name,
  contact_person,
  business_category,
  business_address,
}) {
  const normalizedEmail = normalizeEmail(email);
  const existing = await userModel.findByEmail(normalizedEmail);

  if (existing) {
    throw new AppError(409, 'An account with this email already exists.');
  }

  if (confirm_password !== undefined && confirm_password !== password) {
    throw new AppError(400, 'Password and confirm password do not match.');
  }

  if (role === 'vendor' && !String(company_name || '').trim()) {
    throw new AppError(400, 'Company name is required for vendor registration.');
  }

  const displayName =
    role === 'vendor'
      ? String(contact_person || full_name || '').trim()
      : String(full_name || '').trim();

  if (!displayName) {
    throw new AppError(400, 'A name is required.');
  }

  const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
  const user = await userModel.createUser({
    full_name: displayName,
    email: normalizedEmail,
    phone: normalizePhone(phone),
    password: hashedPassword,
    role,
  });

  let vendorId;
  if (role === 'vendor') {
    try {
      const vendor = await vendorModel.createVendor({
        user_id: user.id,
        company_name: company_name.trim(),
        contact_person: displayName,
        business_category: business_category ? String(business_category).trim() : null,
        business_address: business_address ? String(business_address).trim() : null,
      });
      vendorId = vendor.id;
    } catch (error) {
      await userModel.deleteById(user.id);
      throw error;
    }
  }

  return {
    token: signAuthToken(user, vendorId ? { vendor_id: vendorId } : {}),
    user: toPublicUser(user),
  };
}

async function login({ email, password, role }) {
  const user = await userModel.findByEmail(normalizeEmail(email));

  if (!user) {
    throw new AppError(401, 'Invalid email or password.');
  }

  const passwordMatches = await bcrypt.compare(password, user.password);
  if (!passwordMatches) {
    throw new AppError(401, 'Invalid email or password.');
  }

  if (role && user.role !== role) {
    const other = user.role === 'vendor' ? 'vendor' : 'customer';
    throw new AppError(
      403,
      `This account is registered as a ${other}. Please use the ${other} login.`
    );
  }

  let vendorId;
  if (user.role === 'vendor') {
    const vendor = await vendorModel.findByUserId(user.id);
    vendorId = vendor ? vendor.id : undefined;
  }

  return {
    token: signAuthToken(user, vendorId ? { vendor_id: vendorId } : {}),
    user: toPublicUser(user),
  };
}

async function getCurrentUser(userId) {
  const user = await userModel.findById(userId);
  if (!user) {
    throw new AppError(401, 'Account not found.');
  }
  return toPublicUser(user);
}

async function changePassword(userId, currentPassword, newPassword) {
  const user = await userModel.findById(userId);
  if (!user) {
    throw new AppError(401, 'Account not found.');
  }

  const passwordMatches = await bcrypt.compare(currentPassword, user.password);
  if (!passwordMatches) {
    throw new AppError(401, 'Current password is incorrect.');
  }

  const hashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);
  await userModel.updatePassword(userId, hashedPassword);
}

module.exports = { register, login, getCurrentUser, changePassword };
