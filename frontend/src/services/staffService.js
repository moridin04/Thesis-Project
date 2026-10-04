/*
 * Staff-only barangay rows that include the model prediction.
 * The dashboard list and detail pages call these helpers.
 * The public API does not return the model class or confidence.
 */
import api from './api'

// Keep the DPI class next to the model class so the table can compare them.
function toMlView(row) {
  return {
    id: row.id,
    barangay: row.name,
    dpiRank: row.dpi_rank,
    dpiRiskClass: row.dpi_risk_class,
    mlPredictedRiskClass: row.ml_predicted_risk_class,
    mlPredictionConfidence:
      row.ml_prediction_confidence == null ? null : Number(row.ml_prediction_confidence),
    model: row.model,
    agreesWithDpi: Boolean(row.agrees_with_dpi),
  }
}

// Every barangay with its DPI class and model prediction.
export async function fetchStaffBarangayMlList() {
  const { data } = await api.get('/staff/barangays/ml')
  return data.map(toMlView)
}

// One barangay's model row for the staff detail page.
export async function fetchStaffBarangayMl(id) {
  const { data } = await api.get(`/staff/barangays/${encodeURIComponent(id)}/ml`)
  return toMlView(data)
}
