let loadPromise = null;

const LEAFLET_VERSION = '1.9.4';
const CSS_URL = `https://unpkg.com/leaflet@${LEAFLET_VERSION}/dist/leaflet.css`;
const JS_URL = `https://unpkg.com/leaflet@${LEAFLET_VERSION}/dist/leaflet.js`;

export function loadLeaflet() {
  if (window.L) {
    return Promise.resolve(window.L);
  }

  if (loadPromise) {
    return loadPromise;
  }

  loadPromise = new Promise((resolve, reject) => {
    if (!document.querySelector(`link[href="${CSS_URL}"]`)) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = CSS_URL;
      document.head.appendChild(link);
    }

    const script = document.createElement('script');
    script.src = JS_URL;
    script.async = true;
    script.onload = () => resolve(window.L);
    script.onerror = () => {
      loadPromise = null;
      reject(new Error('Failed to load the map library.'));
    };
    document.head.appendChild(script);
  });

  return loadPromise;
}

const MARKER_FILL = '#F5C400';
const MARKER_STROKE = '#1a1a1a';

const MARKER_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" width="25" height="41" viewBox="0 0 25 41">
  <path d="M12.5 0C5.6 0 0 5.6 0 12.5c0 9.4 12.5 28.5 12.5 28.5s12.5-19.1 12.5-28.5C25 5.6 19.4 0 12.5 0z" fill="${MARKER_FILL}" stroke="${MARKER_STROKE}" stroke-width="1"/>
  <circle cx="12.5" cy="12.5" r="5" fill="${MARKER_STROKE}"/>
</svg>
`.trim();

export function createYellowMarkerIcon(L) {
  return L.icon({
    iconUrl: `data:image/svg+xml,${encodeURIComponent(MARKER_SVG)}`,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
  });
}
