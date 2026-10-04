const CARTO_API_KEY = import.meta.env.VITE_CARTO_API_KEY?.trim()

export const CARTO_TILE_URL = CARTO_API_KEY
  ? `https://basemaps.cartocdn.com/rastertiles/light_all/{z}/{x}/{y}.png?key=${encodeURIComponent(CARTO_API_KEY)}`
  : 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png'

export const CARTO_ATTRIBUTION = '&copy; OpenStreetMap contributors, &copy; CARTO'

/* Module scope: evaluated once per page load, however many maps mount. */
if (!CARTO_API_KEY) {
  console.warn('VITE_CARTO_API_KEY is not set; the CARTO basemap is loading without an API key.')
}
