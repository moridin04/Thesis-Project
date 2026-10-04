/*
 * Loads model metrics for the staff model-results section.
 * useMlResults.js calls this, and the chart components read the shape.
 * The route is GET /ml/results.
 */
import api from './api'

// Rename snake_case fields and fill gaps so the charts can assume arrays.
export async function fetchMlResults() {
  const { data } = await api.get('/ml/results')
  return {
    models: data.models ?? [],
    featureImportance: data.feature_importance ?? {},
    permutationImportance: data.permutation_importance ?? [],
    permutationImportanceModel: data.permutation_importance_model ?? '',
    confusionMatrices: data.confusion_matrices ?? {},
    selectionNote: data.selection_note ?? '',
    nTest: data.n_test ?? null,
    note: data.note ?? '',
  }
}
