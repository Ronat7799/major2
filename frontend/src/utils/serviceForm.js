export const EMPTY_SERVICE_FORM = {
  service_name: '',
  service_category: '',
  starting_price: '',
  minimum_guest_capacity: '',
  maximum_guest_capacity: '',
  estimated_setup_time_value: '',
  estimated_setup_time_unit: '',
  service_description: '',
  availability: 'Active',
};

export function validateServiceForm(form) {
  if (!form.service_name.trim() || !form.service_category.trim() || form.starting_price === '') {
    return 'Service Name, Service Category, and Starting Price are required.';
  }
  if (Number(form.starting_price) < 0) {
    return 'Starting Price must be a positive number.';
  }
  if (form.minimum_guest_capacity !== '' && Number(form.minimum_guest_capacity) < 0) {
    return 'Minimum Guest Capacity cannot be negative.';
  }
  if (form.maximum_guest_capacity !== '' && Number(form.maximum_guest_capacity) < 0) {
    return 'Maximum Guest Capacity cannot be negative.';
  }
  if (
    form.minimum_guest_capacity !== '' &&
    form.maximum_guest_capacity !== '' &&
    Number(form.maximum_guest_capacity) < Number(form.minimum_guest_capacity)
  ) {
    return 'Maximum Guest Capacity must be greater than or equal to Minimum Guest Capacity.';
  }
  if (form.estimated_setup_time_value !== '' && !form.estimated_setup_time_unit) {
    return 'Please select a unit for Estimated Setup Time.';
  }
  if (form.estimated_setup_time_value === '' && form.estimated_setup_time_unit) {
    return 'Please enter a number for Estimated Setup Time.';
  }
  if (form.estimated_setup_time_value !== '' && Number(form.estimated_setup_time_value) < 0) {
    return 'Estimated Setup Time cannot be negative.';
  }
  return '';
}

export function buildEstimatedSetupTime(form) {
  if (form.estimated_setup_time_value === '' || !form.estimated_setup_time_unit) {
    return '';
  }
  return `${form.estimated_setup_time_value} ${form.estimated_setup_time_unit}`;
}

export function parseEstimatedSetupTime(text) {
  if (!text) {
    return { value: '', unit: '' };
  }
  const match = String(text)
    .trim()
    .match(/^(\d+(?:\.\d+)?)\s+(Minutes|Hours|Days)$/i);
  if (!match) {
    return { value: '', unit: '' };
  }
  const unit = match[2][0].toUpperCase() + match[2].slice(1).toLowerCase();
  return { value: match[1], unit };
}

export function toServiceFormValues(service) {
  const setup = parseEstimatedSetupTime(service.estimated_setup_time);
  return {
    service_name: service.service_name || '',
    service_category: service.service_category || '',
    starting_price:
      service.starting_price === null || service.starting_price === undefined
        ? ''
        : String(service.starting_price),
    minimum_guest_capacity:
      service.minimum_guest_capacity === null || service.minimum_guest_capacity === undefined
        ? ''
        : String(service.minimum_guest_capacity),
    maximum_guest_capacity:
      service.maximum_guest_capacity === null || service.maximum_guest_capacity === undefined
        ? ''
        : String(service.maximum_guest_capacity),
    estimated_setup_time_value: setup.value,
    estimated_setup_time_unit: setup.unit,
    service_description: service.service_description || '',
    availability: service.availability || 'Active',
  };
}
