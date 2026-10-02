import api from './api'

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

export async function fetchStaffBarangayMlList() {
  const { data } = await api.get('/staff/barangays/ml')
  return data.map(toMlView)
}

export async function fetchStaffBarangayMl(id) {
  const { data } = await api.get(`/staff/barangays/${encodeURIComponent(id)}/ml`)
  return toMlView(data)
}
