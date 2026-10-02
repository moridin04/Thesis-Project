import api from './api'

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
