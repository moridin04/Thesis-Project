// Groups selection notes, scores, importance, and confusion matrices.
// Dashboard model results is the only page that renders it.
// All numbers come from the useMlResults hook.

import { useState } from 'react'
import { useMlResults } from '../../hooks/useMlResults'
import ConfusionMatrixHeatmap from './ConfusionMatrixHeatmap'
import FeatureImportanceChart from './FeatureImportanceChart'
import ModelComparisonTable from './ModelComparisonTable'
import SelectionCallout from './SelectionCallout'

// Titled card used for the comparison table and the matrices.
function SectionCard({ title, subtitle, note, action, children }) {
  return (
    <section className="card-surface space-y-3 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="font-display text-base font-semibold text-foundation">{title}</h3>
          {subtitle ? <p className="mt-1 text-sm text-ocean">{subtitle}</p> : null}
          {note ? <p className="mt-1 text-xs text-ocean">{note}</p> : null}
        </div>
        {action}
      </div>
      {children}
    </section>
  )
}

/* Five subgrid rows (header, controls, plot, axis, legend) shared with the neighbouring card,
   so both importance charts start, end and label at the same y whatever wraps. */
function ImportanceCard({ title, subtitle, controls, children }) {
  return (
    <section className="card-surface row-span-5 grid min-w-0 grid-rows-subgrid gap-y-3 overflow-x-auto p-5">
      <div>
        <h3 className="font-display text-base font-semibold text-foundation">{title}</h3>
        {subtitle ? <p className="mt-1 text-sm text-ocean">{subtitle}</p> : null}
      </div>
      <div className="flex flex-wrap content-start items-center gap-x-3 gap-y-1">{controls}</div>
      {children}
    </section>
  )
}

// Loads results, then stacks the four model sections.
export default function ModelResultsSection() {
  const { results, loading, error } = useMlResults()
  const [importanceModel, setImportanceModel] = useState('')

  if (loading) {
    return <p className="text-sm text-ocean">Loading model results…</p>
  }
  if (error) {
    return <p className="text-sm text-accent">{error}</p>
  }
  if (!results?.models.length) {
    return (
      <p className="card-surface p-5 text-sm text-ocean">
        Model results have not been published yet.
      </p>
    )
  }

  const { models, featureImportance, permutationImportance, permutationImportanceModel, confusionMatrices } =
    results
  const selectedModel = models.find((model) => model.selected)?.model ?? ''
  const importanceModels = Object.keys(featureImportance)
  // Keep the chosen model, else the selected one, else the first.
  const activeImportanceModel =
    importanceModel && featureImportance[importanceModel]
      ? importanceModel
      : importanceModels.includes(selectedModel)
        ? selectedModel
        : importanceModels[0]
  const matrixModels = models.map((model) => model.model).filter((name) => confusionMatrices[name]?.length)

  return (
    <div className="space-y-4">
      <SelectionCallout selectionNote={results.selectionNote} nTest={results.nTest} models={models} />

      <SectionCard
        title="Model comparison"
        subtitle="Training cross-validation F1-macro (mean ± standard deviation) decides selection. Test columns are for comparison only."
      >
        <ModelComparisonTable models={models} />
      </SectionCard>

      <div className="grid gap-4 xl:grid-cols-2">
        <ImportanceCard
          title="Feature importance"
          subtitle={activeImportanceModel ? `Built-in importance, ${activeImportanceModel}` : undefined}
          controls={
            <>
              {importanceModels.length > 1 ? (
                <select
                  aria-label="Feature importance model"
                  value={activeImportanceModel}
                  onChange={(event) => setImportanceModel(event.target.value)}
                  className="input-field-light w-auto text-sm"
                >
                  {importanceModels.map((name) => (
                    <option key={name} value={name}>
                      {name}
                    </option>
                  ))}
                </select>
              ) : null}
              <p className="text-xs text-ocean">MLP has no built-in importance; see permutation importance.</p>
            </>
          }
        >
          <FeatureImportanceChart
            items={featureImportance[activeImportanceModel] ?? []}
            label={`Feature importance bar chart, ${activeImportanceModel}`}
            axisTitle="Built-in importance"
          />
        </ImportanceCard>

        <ImportanceCard
          title="Permutation importance"
          subtitle="Drop in test F1-macro when each feature is shuffled"
          controls={
            permutationImportanceModel ? (
              <p className="text-xs text-ocean">{permutationImportanceModel}, test set</p>
            ) : null
          }
        >
          <FeatureImportanceChart
            items={permutationImportance}
            label={`Permutation importance bar chart, ${permutationImportanceModel || 'test set'}`}
            axisTitle="Drop in test F1-macro"
          />
        </ImportanceCard>
      </div>

      <SectionCard
        title="Confusion matrices"
        subtitle="Held-out test set. Rows are the actual class, columns the predicted class."
      >
        {matrixModels.length ? (
          <div className="grid gap-4 lg:grid-cols-3">
            {matrixModels.map((name) => (
              <ConfusionMatrixHeatmap
                key={name}
                model={name}
                cells={confusionMatrices[name]}
                selected={name === selectedModel}
              />
            ))}
          </div>
        ) : (
          <p className="text-sm text-ocean">Confusion matrices have not been exported yet.</p>
        )}
      </SectionCard>

      {results.note ? <p className="text-xs leading-relaxed text-ocean">{results.note}</p> : null}
    </div>
  )
}
