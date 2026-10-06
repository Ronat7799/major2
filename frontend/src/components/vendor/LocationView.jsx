import { useEffect, useRef, useState } from 'react';
import { createYellowMarkerIcon, loadLeaflet } from '../../utils/loadLeaflet.js';

const TILE_URL = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
const TILE_ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

export default function LocationView({ latitude, longitude }) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const [error, setError] = useState('');
  const hasLocation = latitude !== null && latitude !== undefined && longitude !== null && longitude !== undefined;

  useEffect(() => {
    if (!hasLocation) {
      return;
    }

    let cancelled = false;
    let resizeObserver;

    loadLeaflet()
      .then((L) => {
        if (cancelled || !mapRef.current) {
          return;
        }

        const position = [Number(latitude), Number(longitude)];
        const map = L.map(mapRef.current, {
          center: position,
          zoom: 15,
          dragging: false,
          zoomControl: false,
          scrollWheelZoom: false,
          doubleClickZoom: false,
        });
        L.tileLayer(TILE_URL, { attribution: TILE_ATTRIBUTION, maxZoom: 19 }).addTo(map);
        L.marker(position, { icon: createYellowMarkerIcon(L), clickable: false }).addTo(map);

        mapInstanceRef.current = map;

        requestAnimationFrame(() => map.invalidateSize());
        resizeObserver = new ResizeObserver(() => map.invalidateSize());
        resizeObserver.observe(mapRef.current);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err.message || 'Unable to load the map.');
        }
      });

    return () => {
      cancelled = true;
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [hasLocation, latitude, longitude]);

  if (!hasLocation) {
    return (
      <div className="flex h-full min-h-64 w-full items-center justify-center rounded-lg border border-gray-200 bg-gray-50 text-sm text-black/40">
        No location set
      </div>
    );
  }

  return (
    <div className="h-full">
      <a
        href={`https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`}
        target="_blank"
        rel="noopener noreferrer"
        title="Open in Google Maps"
        className="block h-full"
      >
        <div ref={mapRef} className="h-full min-h-64 w-full cursor-pointer rounded-lg border border-gray-200 bg-gray-50 hover:opacity-90" />
      </a>
      {error ? <p className="mt-1 text-sm text-red-600">{error}</p> : null}
    </div>
  );
}
