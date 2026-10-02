import { useEffect, useMemo, useState } from 'react'
import PageHeader from '../../components/shared/PageHeader'
import RiskBadge from '../../components/shared/RiskBadge'
import { fetchPublicRankings } from '../../services/publicService'

const MAX_SLOTS = 4

function formatNumber(value, digits = 1) {
  if (value == null || Number.isNaN(Number(value))) return '—'
  return Number(value).toLocaleString(undefined, { maximumFractionDigits: digits })
}

export default function CompareBarangays() {
  const [catalog, setCatalog] = useState([])
  const [selectedIds, setSelectedIds] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    fetchPublicRankings()
      .then((data) => {
        if (!active) return
        setCatalog(data)
        setSelectedIds(data.slice(0, 3).map((row) => row.id))
      })
      .catch(() => {
        if (active) setError('Unable to load barangays to compare. Check that the API is running.')
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [])

  const selected = useMemo(
    () => selectedIds.map((id) => catalog.find((row) => row.id === id)).filter(Boolean),
    [catalog, selectedIds],
  )

  function updateSlot(index, nextId) {
    setSelectedIds((current) => current.map((id, slot) => (slot === index ? nextId : id)))
  }

  function removeSlot(index) {
    setSelectedIds((current) => current.filter((_, slot) => slot !== index))
  }

  function addSlot() {
    const next = catalog.find((row) => !selectedIds.includes(row.id))
    if (next) setSelectedIds((current) => [...current, next.id])
  }

  const metrics = [
    { label: 'DPI score (0–100)', render: (row) => Math.round(row.priorityScore) },
    { label: 'Risk priority class', render: (row) => <RiskBadge category={row.riskLevel} /> },
    { label: 'Population (2024)', render: (row) => Math.round(row.population).toLocaleString() },
    { label: '5-year flood coverage', render: (row) => `${row.floodPct5yr.toFixed(1)}%` },
    { label: '25-year flood coverage', render: (row) => `${row.floodPct25yr.toFixed(1)}%` },
    { label: 'Elevation_Mean', render: (row) => (row.elevationMean == null ? '—' : `${row.elevationMean.toFixed(2)} m`) },
    { label: 'Population density (per hectare)', render: (row) => formatNumber(row.populationDensity, 1) },
    { label: 'Population change 2020–2024 (%)', render: (row) => `${formatNumber(row.populationChangePct, 2)}%` },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Compare Barangays"
        subtitle="Choose two to four barangays. The first visit starts with the three highest-priority areas."
      />
      {loading ? <p className="text-sm text-ocean">Loading comparison…</p> : null}
      {error ? <p className="text-sm text-accent">{error}</p> : null}
      {!loading && !error ? (
        <>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {selectedIds.map((id, index) => (
              <div key={`${id}-${index}`} className="card-surface space-y-2 p-3">
                <label className="block text-xs font-semibold uppercase tracking-wide text-ocean" htmlFor={`compare-slot-${index}`}>
                  Barangay {index + 1}
                </label>
                <select
                  id={`compare-slot-${index}`}
                  value={id}
                  onChange={(event) => updateSlot(index, event.target.value)}
                  className="input-field-light w-full"
                >
                  {catalog.map((row) => (
                    <option key={row.id} value={row.id} disabled={selectedIds.includes(row.id) && row.id !== id}>
                      {row.barangay}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => removeSlot(index)}
                  disabled={selectedIds.length <= 2}
                  className="text-xs font-medium text-action disabled:opacity-40"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
          {selectedIds.length < MAX_SLOTS ? (
            <button type="button" onClick={addSlot} className="text-sm font-medium text-action hover:underline">
              Add barangay
            </button>
          ) : null}
          <div className="card-surface overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-surface">
                <tr>
                  <th className="px-4 py-3 text-ocean">Metric</th>
                  {selected.map((row) => (
                    <th key={row.id} className="px-4 py-3 text-foundation">
                      {row.barangay}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {metrics.map((metric) => (
                  <tr key={metric.label} className="border-t border-pale/60">
                    <td className="px-4 py-3 font-medium text-foundation">{metric.label}</td>
                    {selected.map((row) => (
                      <td key={row.id} className="px-4 py-3 text-ocean">
                        {metric.render(row)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : null}
    </div>
  )
}
