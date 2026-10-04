// Staff list of the DPI class beside the model-predicted class.
// App.jsx mounts this at /dashboard/barangays for staff and admin.
// Rows come from fetchStaffBarangayMlList in staffService.
// Search and the differs-only filter run in the browser.
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import PageHeader from '../../components/shared/PageHeader'
import RiskBadge from '../../components/shared/RiskBadge'
import MlAgreementBadge from '../../components/staff/MlAgreementBadge'
import { IN_SAMPLE_NOTE } from '../../components/staff/mlNotes'
import { fetchStaffBarangayMlList } from '../../services/staffService'

// Table of rank, both classes, confidence, and whether they agree.
export default function DashboardBarangays() {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [query, setQuery] = useState('')
  const [differsOnly, setDiffersOnly] = useState(false)

  useEffect(() => {
    let active = true
    fetchStaffBarangayMlList()
      .then((data) => {
        if (active) setRows(data)
      })
      .catch(() => {
        if (active) setError('Unable to load barangays. Check that the API is running.')
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [])

  const differsCount = useMemo(() => rows.filter((row) => !row.agreesWithDpi).length, [rows])

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase()
    return rows.filter(
      (row) =>
        (!differsOnly || !row.agreesWithDpi) &&
        (!needle || row.barangay.toLowerCase().includes(needle)),
    )
  }, [rows, query, differsOnly])

  return (
    <div className="space-y-6">
      <PageHeader
        title="Barangays"
        subtitle="DPI class alongside the model-predicted class (staff only)"
      />
      <p className="disclaimer-soft px-4 py-3 text-sm leading-relaxed">{IN_SAMPLE_NOTE}</p>
      <div className="flex flex-wrap items-center gap-3">
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search barangay…"
          className="input-field-light max-w-xs"
          aria-label="Search barangays"
        />
        <label className="inline-flex items-center gap-2 text-sm text-ocean">
          <input
            type="checkbox"
            checked={differsOnly}
            onChange={(event) => setDiffersOnly(event.target.checked)}
          />
          Only barangays where the predicted class differs from the DPI class
          {rows.length ? ` (${differsCount})` : ''}
        </label>
      </div>
      {loading ? <p className="text-sm text-ocean">Loading barangays…</p> : null}
      {error ? <p className="text-sm text-accent">{error}</p> : null}
      {!loading && !error ? (
        <div className="card-surface overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-surface">
              <tr>
                <th className="px-4 py-3 text-ocean">Rank</th>
                <th className="px-4 py-3 text-ocean">Barangay</th>
                <th className="px-4 py-3 text-ocean">DPI class</th>
                <th className="px-4 py-3 text-ocean">Model-predicted class</th>
                <th className="px-4 py-3 text-ocean">Confidence</th>
                <th className="px-4 py-3 text-ocean">Agreement</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-ocean">
                    No barangays match the current filters.
                  </td>
                </tr>
              ) : (
                filtered.map((row) => (
                  <tr key={row.id} className="border-t border-pale/60">
                    <td className="px-4 py-3 text-foundation">{row.dpiRank}</td>
                    <td className="px-4 py-3">
                      <Link
                        to={`/dashboard/barangays/${encodeURIComponent(row.id)}`}
                        className="font-medium text-ocean hover:text-action"
                      >
                        {row.barangay}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <RiskBadge category={row.dpiRiskClass} />
                    </td>
                    <td className="px-4 py-3">
                      <RiskBadge category={row.mlPredictedRiskClass} />
                    </td>
                    <td className="px-4 py-3 tabular-nums">
                      {row.mlPredictionConfidence == null
                        ? '—'
                        : `${(row.mlPredictionConfidence * 100).toFixed(1)}%`}
                    </td>
                    <td className="px-4 py-3">
                      <MlAgreementBadge agrees={row.agreesWithDpi} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  )
}
