/*
 * Data-type choices for the staff upload form.
 * DashboardUpload.jsx and ReviewUploads.jsx show these labels.
 * The stored values must stay aligned with the backend upload service.
 */
/* Values must match VALID_DATA_TYPES in backend/app/services/upload_service.py.
   Labels stay source-neutral: LGUs may upload equivalent data from any agency or provider. */
export const UPLOAD_DATA_TYPES = [
  { value: 'flood_hazard_5yr', label: 'Flood hazard, 5-year return period' },
  { value: 'flood_hazard_25yr', label: 'Flood hazard, 25-year return period' },
  { value: 'elevation_dtm', label: 'Elevation (DTM)' },
  { value: 'population', label: 'Population (2020 and 2024)' },
  { value: 'barangay_boundaries', label: 'Barangay boundaries' },
  { value: 'other', label: 'Other (specify in notes)' },
]

// Lookup from the stored value to the label shown in the tables.
const LABELS = new Map(UPLOAD_DATA_TYPES.map((type) => [type.value, type.label]))

/* Uploads saved before this list existed hold free text; show it unchanged. */
export function dataTypeLabel(value) {
  const raw = value == null ? '' : String(value).trim()
  if (!raw) return '—'
  return LABELS.get(raw) ?? raw
}

/* The backend has no source column, so the optional source is stored as the first line of notes. */
export function composeUploadNotes(source, notes) {
  const origin = source == null ? '' : String(source).trim()
  const details = notes == null ? '' : String(notes).trim()
  if (!origin) return details
  return details ? `Source: ${origin}\n${details}` : `Source: ${origin}`
}
