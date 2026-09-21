function toVendorProfileView(vendor, user) {
  return {
    company_name: vendor.company_name,
    contact_person: vendor.contact_person,
    business_category: vendor.business_category,
    business_address: vendor.business_address,
    business_description: vendor.business_description,
    year_of_experience: vendor.year_of_experience,
    languages_spoken: vendor.languages_spoken || [],
    profile_image: vendor.profile_image,
    cover_image: vendor.cover_image,
    full_address: vendor.full_address,
    latitude: vendor.latitude,
    longitude: vendor.longitude,
    email: user.email,
    phone: user.phone,
  };
}

module.exports = { toVendorProfileView };
