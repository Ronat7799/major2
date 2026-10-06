import { useEffect, useRef, useState } from 'react';
import { createYellowMarkerIcon, loadLeaflet } from '../../utils/loadLeaflet.js';
import { buildShortAddress, reverseGeocode, searchPlaces } from '../../utils/nominatim.js';

const DEFAULT_CENTER = [11.5564, 104.9282]; 
const TILE_URL = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
const TILE_ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

function coordinateLabel(lat, lng) {
  return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
}

function LocationIcon({ className = 'h-4 w-4' }) {
  return (
    <svg viewBox="0 0 20 20" className={className} fill="none" aria-hidden="true">
      <path
        d="M10 17.5s6-5.1 6-9.5a6 6 0 1 0-12 0c0 4.4 6 9.5 6 9.5Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <circle cx="10" cy="8" r="2" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

function SearchIcon({ className = 'h-4 w-4' }) {
  return (
    <svg viewBox="0 0 20 20" className={className} fill="none" aria-hidden="true">
      <circle cx="9" cy="9" r="6" stroke="currentColor" strokeWidth="1.5" />
      <path d="m17 17-3.5-3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

const EMPTY_LOCATION = { full_address: '', latitude: '', longitude: '' };

export default function EventLocationPicker({ value, onChange, placeholder = 'Select event location' }) {
  const wrapperRef = useRef(null);
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);
  const debounceRef = useRef(null);

  const [open, setOpen] = useState(false);
  const [tempLocation, setTempLocation] = useState(value || EMPTY_LOCATION);
  const [query, setQuery] = useState(value?.full_address || '');
  const [suggestions, setSuggestions] = useState([]);
  const [searching, setSearching] = useState(false);
  const [mapError, setMapError] = useState('');
  const [mapReady, setMapReady] = useState(false);

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    function handlePointerDown(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setOpen(false);
      }
    }

    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    }

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    let cancelled = false;
    const startLocation = value && value.latitude !== '' && value.latitude != null ? value : EMPTY_LOCATION;
    const hasSavedLocation = startLocation.latitude !== '' && startLocation.latitude != null;
    const center = hasSavedLocation ? [Number(startLocation.latitude), Number(startLocation.longitude)] : DEFAULT_CENTER;

    loadLeaflet()
      .then((L) => {
        if (cancelled || !mapRef.current) {
          return;
        }

        const map = L.map(mapRef.current).setView(center, hasSavedLocation ? 16 : 12);
        L.tileLayer(TILE_URL, { attribution: TILE_ATTRIBUTION, maxZoom: 19 }).addTo(map);
        const marker = L.marker(center, { draggable: true, icon: createYellowMarkerIcon(L) }).addTo(map);

        mapInstanceRef.current = map;
        markerRef.current = marker;

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
          setTempLocation({ full_address, latitude: lat, longitude: lng });
        }

        marker.on('dragend', () => {
          const position = marker.getLatLng();
          applyPosition(position.lat, position.lng);
        });

        map.on('click', (event) => {
          applyPosition(event.latlng.lat, event.latlng.lng);
        });

        setMapReady(true);
      })
      .catch((err) => {
        if (!cancelled) {
          setMapError(err.message || 'Unable to load the map.');
        }
      });

    return () => {
      cancelled = true;
      setMapReady(false);
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [open]);

  function openPicker() {
    setTempLocation(value || EMPTY_LOCATION);
    setQuery(value?.full_address || '');
    setSuggestions([]);
    setMapError('');
    setOpen(true);
  }

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
    setTempLocation({ full_address, latitude: lat, longitude: lng });

    if (mapInstanceRef.current && markerRef.current) {
      mapInstanceRef.current.setView([lat, lng], 16);
      markerRef.current.setLatLng([lat, lng]);
    }
  }

  function handleConfirm() {
    onChange(tempLocation);
    setOpen(false);
  }

  const hasValue = Boolean(value?.full_address);
  const canConfirm = tempLocation.latitude !== '' && tempLocation.latitude != null;

  return (
    <div ref={wrapperRef} className="relative">
      <button
        type="button"
        onClick={openPicker}
        className={`ui-yellow-border flex w-full items-center gap-2.5 rounded-xl border px-4 py-3.5 text-left text-sm outline-none transition-colors duration-200 ${
          open ? 'border-[#F5C400]' : 'border-gray-200'
        } bg-white`}
      >
        <LocationIcon className="h-4 w-4 shrink-0 text-black/35" />
        <span className={`truncate ${hasValue ? 'font-semibold text-black' : 'text-black/35'}`}>
          {hasValue ? value.full_address : placeholder}
        </span>
      </button>

      {open ? (
        <div className="absolute left-0 top-full z-30 mt-2 w-full rounded-2xl border border-gray-100 bg-white p-5 shadow-xl sm:p-6">
          <div className="relative">
            <SearchIcon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-black/35" />
            <input
              type="text"
              value={query}
              onChange={(event) => handleQueryChange(event.target.value)}
              placeholder="Search for the event location"
              className="ui-yellow-border w-full rounded-xl border border-gray-200 py-3 pl-10 pr-4 text-sm text-black outline-none transition-colors duration-200 placeholder:text-black/35"
            />
            {suggestions.length > 0 ? (
              <ul className="absolute left-0 right-0 top-full z-40 mt-1.5 max-h-52 overflow-y-auto rounded-xl border border-gray-100 bg-white shadow-lg">
                {suggestions.map((place) => (
                  <li key={place.place_id}>
                    <button
                      type="button"
                      onClick={() => selectSuggestion(place)}
                      className="block w-full px-4 py-2.5 text-left text-sm text-black transition-colors duration-150 hover:bg-gray-50"
                    >
                      {place.display_name}
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
          {searching ? <p className="mt-1.5 text-xs text-black/45">Searching…</p> : null}

          <div className="relative mt-3">
            <div ref={mapRef} className="h-64 w-full rounded-xl border border-gray-200 bg-gray-50 sm:h-72" />
            {!mapReady && !mapError ? (
              <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-gray-50 text-xs text-black/45">
                Loading map…
              </div>
            ) : null}
          </div>
          {mapError ? <p className="mt-1.5 text-sm text-red-600">{mapError}</p> : null}
          {mapReady ? (
            <p className="mt-2 text-xs text-black/45">Click anywhere on the map or drag the marker to set the exact spot.</p>
          ) : null}

          <button
            type="button"
            onClick={handleConfirm}
            disabled={!canConfirm}
            className="ui-yellow ui-yellow-hover mt-5 w-full rounded-full py-3.5 text-sm font-bold text-black transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-none"
          >
            Confirm Location
          </button>
        </div>
      ) : null}
    </div>
  );
}
