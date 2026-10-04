// Shared CARTO basemap URL for the priority map and barangay profile.
// Both pages import CARTO_TILE_URL and CARTO_ATTRIBUTION.
// The URL is built from VITE_CARTO_API_KEY when that variable is set.

const CARTO_API_KEY = import.meta.env.VITE_CARTO_API_KEY?.trim()

// Tile template. The key stays in the environment variable.
export const CARTO_TILE_URL = CARTO_API_KEY
  ? `https://basemaps.cartocdn.com/rastertiles/light_all/{z}/{x}/{y}.png?key=${encodeURIComponent(CARTO_API_KEY)}`
  : 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png'

// Credit line shown with the basemap.
export const CARTO_ATTRIBUTION = '&copy; OpenStreetMap contributors, &copy; CARTO'

/* Module scope: evaluated once per page load, however many maps mount. */
if (!CARTO_API_KEY) {
  console.warn('VITE_CARTO_API_KEY is not set; the CARTO basemap is loading without an API key.')
}
