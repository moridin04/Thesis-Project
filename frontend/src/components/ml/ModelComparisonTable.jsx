function formatScore(value) {
  if (value == null || Number.isNaN(Number(value))) return '—'
  return Number(value).toFixed(4)
}

const columns = [
  {
    label: 'CV F1-macro',
    render: (model) => (
      <>
        {formatScore(model.cv_f1_macro_mean)}
        <span className="text-xs text-ocean/80"> ± {formatScore(model.cv_f1_macro_std)}</span>
      </>
    ),
  },
  { label: 'Test accuracy', render: (model) => formatScore(model.accuracy) },
  { label: 'Test balanced accuracy', render: (model) => formatScore(model.balanced_accuracy) },
  { label: 'Test F1-macro', render: (model) => formatScore(model.f1_macro) },
  { label: 'Test F1-weighted', render: (model) => formatScore(model.f1_weighted) },
  { label: 'Test ROC AUC (OvR macro)', render: (model) => formatScore(model.roc_auc_ovr_macro) },
]

function SelectedBadge() {
  return (
    <span className="inline-flex items-center rounded-full bg-[color-mix(in_srgb,var(--primary)_12%,white)] px-2.5 py-0.5 text-xs font-semibold text-[var(--primary)] ring-1 ring-inset ring-[color-mix(in_srgb,var(--primary)_28%,white)]">
      Selected
    </span>
  )
}

export default function ModelComparisonTable({ models }) {
  return (
    <div className="card-surface overflow-x-auto">
      <table className="min-w-full text-left text-sm">
        <caption className="sr-only">
          Model comparison: training cross-validation F1-macro and held-out test metrics
        </caption>
        <thead className="bg-surface">
          <tr>
            <th scope="col" className="px-4 py-3 text-ocean">Model</th>
            {columns.map((column) => (
              <th key={column.label} scope="col" className="px-4 py-3 text-ocean">
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {models.map((model) => (
            <tr
              key={model.model}
              className={`border-t border-pale/60 ${model.selected ? 'bg-[color-mix(in_srgb,var(--primary)_5%,white)]' : ''}`}
            >
              <th scope="row" className="px-4 py-3 font-medium text-foundation">
                <span className="flex flex-wrap items-center gap-2">
                  {model.model}
                  {model.selected ? <SelectedBadge /> : null}
                </span>
              </th>
              {columns.map((column) => (
                <td key={column.label} className="px-4 py-3 tabular-nums text-ocean">
                  {column.render(model)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
