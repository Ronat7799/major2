function toPublicUser(user) {
  return {
    id: user.id,
    full_name: user.full_name,
    email: user.email,
    phone: user.phone,
    role: user.role,
    profile_image: user.profile_image || null,
    created_at: user.created_at,
  };
}

module.exports = { toPublicUser };
