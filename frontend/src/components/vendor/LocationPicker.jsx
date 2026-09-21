import { useEffect, useRef, useState } from 'react';
import { createYellowMarkerIcon, loadLeaflet } from '../../utils/loadLeaflet.js';
import { buildShortAddress, reverseGeocode, searchPlaces } from '../../utils/nominatim.js';

const DEFAULT_CENTER = [11.5564, 104.9282]; // Phnom Penh
const TILE_URL = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
const TILE_ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

function coordinateLabel(lat, lng) {
  return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
}

export default function LocationPicker({ value, onChange }) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);
  const onChangeRef = useRef(onChange);
  const debounceRef = useRef(null);
  const [query, setQuery] = useState(value.full_address || '');
  const [suggestions, setSuggestions] = useState([]);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState('');
  const [ready, setReady] = useState(false);

  onChangeRef.current = onChange;

  useEffect(() => {
    let cancelled = false;

    loadLeaflet()
      .then((L) => {
        if (cancelled || !mapRef.current) {
          return;
        }

        const hasSavedLocation = value.latitude !== '' && value.longitude !== '';
        const center = hasSavedLocation ? [Number(value.latitude), Number(value.longitude)] : DEFAULT_CENTER;

        const map = L.map(mapRef.current).setView(center, hasSavedLocation ? 16 : 12);
        L.tileLayer(TILE_URL, { attribution: TILE_ATTRIBUTION, maxZoom: 19 }).addTo(map);
        const marker = L.marker(center, { draggable: true, icon: createYellowMarkerIcon(L) }).addTo(map);

        mapInstanceRef.current = map;
        markerRef.current = marker;

        // Always resolves both an address AND coordinates together, never one without the other,
        // so the profile save can never see a half-selected location.
        async function applyPosition(lat, lng) {
          marker.setLatLng([lat, lng]);

          let full_address;
          try {
            full_address = (await reverseGeocode(lat, lng)) || coordinateLabel(lat, lng);
          } catch {
            full_address = coordinateLabel(lat, lng);
          }

          setQuery(full_address);
          setSuggestions([]);
          onChangeRef.current({ full_address, latitude: lat, longitude: lng });
        }

        marker.on('dragend', () => {
          const position = marker.getLatLng();
          applyPosition(position.lat, position.lng);
        });

        map.on('click', (event) => {
          applyPosition(event.latlng.lat, event.latlng.lng);
        });

        setReady(true);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err.message || 'Unable to load the map.');
        }
      });

    return () => {
      cancelled = true;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleQueryChange(text) {
    setQuery(text);

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (text.trim().length < 3) {
      setSuggestions([]);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const results = await searchPlaces(text);
        setSuggestions(results);
      } catch {
        setSuggestions([]);
      } finally {
        setSearching(false);
      }
    }, 500);
  }

  function selectSuggestion(place) {
    const lat = Number(place.lat);
    const lng = Number(place.lon);
    const full_address = buildShortAddress(place.address, place.display_name);

    setQuery(full_address);
    setSuggestions([]);

    if (mapInstanceRef.current && markerRef.current) {
      mapInstanceRef.current.setView([lat, lng], 16);
      markerRef.current.setLatLng([lat, lng]);
    }

    onChangeRef.current({ full_address, latitude: lat, longitude: lng });
  }

  return (
    <div>
      <span className="mb-1.5 block text-sm font-medium text-black">Business Location</span>
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(event) => handleQueryChange(event.target.value)}
          placeholder="Search for your business location"
          className="ui-yellow-border mb-2 w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none"
        />
        {suggestions.length > 0 ? (
          <ul className="absolute z-[1000] max-h-48 w-full overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-sm">
            {suggestions.map((place) => (
              <li key={place.place_id}>
                <button
                  type="button"
                  onClick={() => selectSuggestion(place)}
                  className="block w-full px-3 py-2 text-left text-sm text-black hover:bg-gray-50"
                >
                  {place.display_name}
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
      {searching ? <p className="text-xs text-black/55">Searching…</p> : null}
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      <div ref={mapRef} className="h-64 w-full rounded-lg border border-gray-200 bg-gray-50" />
      {!ready && !error ? <p className="mt-1 text-xs text-black/55">Loading map…</p> : null}
      {ready ? (
        <p className="mt-1 text-xs text-black/55">Click anywhere on the map or drag the marker to set the exact position.</p>
      ) : null}
    </div>
  );
}
