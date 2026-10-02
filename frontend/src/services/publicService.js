import api from './api'

function toBarangayView(row) {
  const hazard = Number(row.hazard) || 0
  const exposure = Number(row.exposure) || 0
  const vulnerability = Number(row.vulnerability) || 0
  return {
    id: String(row.id),
    barangay: row.name,
    district: row.district || 'Unassigned',
    dpi: Number(row.dpi) || 0,
    riskLevel: row.risk_category,
    hazard,
    exposure,
    vulnerability,
    hazardScore: Math.round(hazard * 100),
    exposureScore: Math.round(exposure * 100),
    vulnerabilityScore: Math.round(vulnerability * 100),
    priorityScore: Math.round(Number(row.dpi_scaled) || 0),
    population: Number(row.population_2024) || 0,
    populationDensity: Number(row.population_density_per_hectare) || 0,
    populationChangePct: Number(row.population_change_2020_2024_pct) || 0,
    floodPct5yr: Number(row.flood_pct_5yr) || 0,
    floodPct25yr: Number(row.flood_pct_25yr) || 0,
    dpiRank: row.dpi_rank,
    bestModel: row.best_model,
    imageUrl: row.image_url || null,
    elevationMean: row.elevation_mean == null ? null : Number(row.elevation_mean),
  }
}

export async function fetchPublicOverview() {
  const { data } = await api.get('/public/overview')
  return data
}

export async function fetchPublicBarangays() {
  const { data } = await api.get('/public/barangays')
  return data.map(toBarangayView)
}

export async function fetchPublicBarangay(id) {
  const { data } = await api.get(`/public/barangays/${id}`)
  return toBarangayView(data)
}

export async function fetchPublicRankings() {
  const { data } = await api.get('/public/rankings')
  return data.map(toBarangayView)
}

