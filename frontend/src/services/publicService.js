/*
 * Public barangay, overview, ranking, and model-summary calls.
 * The map, rankings, profile, compare, and methodology pages use these.
 * toBarangayView turns API rows into the field names those pages read.
 */
import api from './api'

// Map one API barangay row into the fields the public pages render.
function toBarangayView(row) {
  const hazard = Number(row.hazard) || 0
  const exposure = Number(row.exposure) || 0
  const vulnerability = Number(row.vulnerability) || 0
  return {
    id: String(row.id),
    barangay: row.name,
    district: row.district || 'Unassigned',
    area: row.area || '',
    dpi: Number(row.dpi) || 0,
    riskLevel: row.risk_category,
    hazard,
    exposure,
    vulnerability,
    hazardScore: Math.round(hazard * 100),
    exposureScore: Math.round(exposure * 100),
    vulnerabilityScore: Math.round(vulnerability * 100),
    priorityScore: Number(row.priority_score) || 0,
    population: Number(row.population_2024) || 0,
    populationDensity: Number(row.population_density_per_hectare) || 0,
    populationChangePct: Number(row.population_change_2020_2024_pct) || 0,
    floodPct5yr: Number(row.flood_pct_5yr) || 0,
    floodPct25yr: Number(row.flood_pct_25yr) || 0,
    dpiRank: row.dpi_rank,
    planningReference: row.planning_reference || '',
    drrmPillar: row.drrm_pillar || '',
    imageUrl: row.image_url || null,
    elevationMean: row.elevation_mean == null ? null : Number(row.elevation_mean),
  }
}

// City-wide counts for the public overview.
export async function fetchPublicOverview() {
  const { data } = await api.get('/public/overview')
  return data
}

// All public barangay rows, mapped for the map and dashboard.
export async function fetchPublicBarangays() {
  const { data } = await api.get('/public/barangays')
  return data.map(toBarangayView)
}

// One barangay for the profile page. The id is encoded for the URL.
export async function fetchPublicBarangay(id) {
  const { data } = await api.get(`/public/barangays/${encodeURIComponent(id)}`)
  return toBarangayView(data)
}

// Model comparison text for the methodology page.
export async function fetchPublicModelSummary() {
  const { data } = await api.get('/public/model-summary')
  return data
}

// Ranked barangays for the rankings and compare pages.
export async function fetchPublicRankings() {
  const { data } = await api.get('/public/rankings')
  return data.map(toBarangayView)
}
