function toServiceView(service, images = []) {
  return {
    id: service.id,
    vendor_id: service.vendor_id,
    service_name: service.service_name,
    service_category: service.service_category,
    starting_price: service.starting_price,
    minimum_guest_capacity: service.minimum_guest_capacity,
    maximum_guest_capacity: service.maximum_guest_capacity,
    estimated_setup_time: service.estimated_setup_time,
    service_description: service.service_description,
    availability: service.availability,
    image_url: images[0]?.image_url || null,
    images,
    created_at: service.created_at,
    updated_at: service.updated_at,
  };
}

module.exports = { toServiceView };
