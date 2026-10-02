const CLASS_ORDER = ['Low', 'Medium', 'High']

function buildMatrix(cells) {
  const lookup = new Map(cells.map((cell) => [`${cell.actual}|${cell.predicted}`, cell.count]))
  return CLASS_ORDER.map((actual) => {
    const counts = CLASS_ORDER.map((predicted) => lookup.get(`${actual}|${predicted}`) ?? null)
    const total = counts.reduce((sum, count) => sum + (count ?? 0), 0)
    return { actual, counts, total }
  })
}

function cellStyle(count, total) {
  const share = total > 0 && count != null ? count / total : 0
  return {
    backgroundColor: `color-mix(in srgb, var(--primary) ${Math.round(share * 85)}%, white)`,
    color: share > 0.5 ? 'white' : undefined,
  }
}

export default function ConfusionMatrixHeatmap({ model, cells, selected }) {
  const rows = buildMatrix(cells)
  const correct = rows.reduce((sum, row, index) => sum + (row.counts[index] ?? 0), 0)
  const total = rows.reduce((sum, row) => sum + row.total, 0)

  return (
    <figure className="card-surface space-y-3 p-4">
      <figcaption className="flex flex-wrap items-baseline justify-between gap-2">
        <span className="font-display text-base font-semibold text-foundation">
          {model}
          {selected ? <span className="ml-2 text-xs font-semibold text-[var(--primary)]">Selected</span> : null}
        </span>
        <span className="text-xs text-ocean">
          {correct} of {total} correct
        </span>
      </figcaption>
      <table className="w-full table-fixed text-center text-sm">
        <thead>
          <tr>
            <th scope="col" className="pb-1 text-left text-xs font-medium text-ocean">
              Actual ↓ / Predicted →
            </th>
            {CLASS_ORDER.map((cls) => (
              <th key={cls} scope="col" className="pb-1 text-xs font-semibold text-foundation">
                {cls}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.actual}>
              <th scope="row" className="py-1 pr-2 text-left text-xs font-semibold text-foundation">
                {row.actual}
              </th>
              {row.counts.map((count, index) => (
                <td
                  key={CLASS_ORDER[index]}
                  className="rounded-md border border-white py-3 font-semibold tabular-nums text-foundation"
                  style={cellStyle(count, row.total)}
                  aria-label={`Actual ${row.actual}, predicted ${CLASS_ORDER[index]}: ${count ?? 'no data'}`}
                >
                  {count ?? '—'}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  )
}
