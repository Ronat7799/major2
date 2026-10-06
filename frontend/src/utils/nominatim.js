const BASE_URL = 'https://nominatim.openstreetmap.org';

export function buildShortAddress(address, fallback) {
  if (!address) {
    return fallback || null;
  }

  const street =
    address.amenity ||
    address.tourism ||
    address.shop ||
    address.leisure ||
    address.building ||
    address.road ||
    address.pedestrian ||
    address.neighbourhood ||
    address.hamlet;
  const district = address.city_district || address.town || address.suburb || address.county || address.city;
  const top = address.state || address.region || address.state_district;

  const parts = [street, district, top].filter((part, index, all) => part && all.indexOf(part) === index);
  return parts.length ? parts.join(', ') : fallback || null;
}

export async function searchPlaces(query) {
  if (!query || query.trim().length < 3) {
    return [];
  }

  const url = `${BASE_URL}/search?format=json&addressdetails=1&limit=5&q=${encodeURIComponent(query)}`;
  const response = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!response.ok) {
    throw new Error('Location search failed.');
  }
  return response.json();
}

export async function reverseGeocode(lat, lng) {
  const url = `${BASE_URL}/reverse?format=json&addressdetails=1&lat=${lat}&lon=${lng}`;
  const response = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!response.ok) {
    throw new Error('Reverse geocoding failed.');
  }
  const data = await response.json();
  return buildShortAddress(data.address, data.display_name);
}
