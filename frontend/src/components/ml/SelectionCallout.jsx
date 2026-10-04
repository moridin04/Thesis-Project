// Short note on how the winning model was chosen.
// Model results places this note above the score table.
// The text and class counts come from the ml results payload.

const CLASS_ORDER = ['Low', 'Medium', 'High']

// Reads support for Low, Medium, and High from the first model.
function perClassSupport(models) {
  const reference = models[0]?.per_class ?? {}
  return CLASS_ORDER.filter((cls) => reference[cls]).map((cls) => ({
    cls,
    support: reference[cls].support,
  }))
}

// Prints the selection note and the held-out class counts.
export default function SelectionCallout({ selectionNote, nTest, models }) {
  const supports = perClassSupport(models)
  return (
    <section className="disclaimer-soft space-y-2 px-4 py-4 text-sm leading-relaxed">
      <h3 className="font-display text-base font-semibold text-foundation">How the model was selected</h3>
      {selectionNote ? <p>{selectionNote}</p> : null}
      <p>
        The target is the Low, Medium or High class of the DPI score (0–100).
        {nTest != null ? (
          <>
            {' '}Test metrics use {nTest} held-out barangays
            {supports.length
              ? ` (${supports.map(({ cls, support }) => `${support} ${cls}`).join(', ')})`
              : ''}
            .
          </>
        ) : null}
      </p>
    </section>
  )
}
