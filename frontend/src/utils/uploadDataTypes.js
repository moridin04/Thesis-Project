/* Values must match VALID_DATA_TYPES in backend/app/services/upload_service.py. */
export const UPLOAD_DATA_TYPES = [
  { value: 'flood_hazard_5yr', label: 'Flood hazard (LiPAD), 5-year return period' },
  { value: 'flood_hazard_25yr', label: 'Flood hazard (LiPAD), 25-year return period' },
  { value: 'elevation_dtm', label: 'Elevation (DTM)' },
  { value: 'population', label: 'Population (PSA 2020 and 2024)' },
  { value: 'barangay_boundaries', label: 'Barangay boundaries' },
  { value: 'other', label: 'Other (specify in notes)' },
]

const LABELS = new Map(UPLOAD_DATA_TYPES.map((type) => [type.value, type.label]))

/* Uploads saved before this list existed hold free text; show it unchanged. */
export function dataTypeLabel(value) {
  const raw = value == null ? '' : String(value).trim()
  if (!raw) return '—'
  return LABELS.get(raw) ?? raw
}
