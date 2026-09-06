import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import PageHeader from '../../components/shared/PageHeader'
import RiskBadge from '../../components/shared/RiskBadge'
import { useApprovedBarangays } from '../../hooks/useApprovedBarangays'

export default function Rankings() {
  const priorityBarangays = useApprovedBarangays()
  const [searchParams] = useSearchParams()
  const initialQuery = searchParams.get('q') ?? ''
  const [query, setQuery] = useState(initialQuery)

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase()
    if (!needle) return priorityBarangays
    return priorityBarangays.filter(
      (row) =>
        row.barangay.toLowerCase().includes(needle) ||
        row.district.toLowerCase().includes(needle),
    )
  }, [query, priorityBarangays])

  return (
    <div className="space-y-6">
      <PageHeader
        title="Rankings"
        subtitle="Barangays ordered by published disaster priority score"
      />
      <div className="flex flex-wrap gap-3">
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search barangay…"
          className="input-field-light max-w-xs"
          aria-label="Search barangays"
        />
        <select className="input-field-light max-w-xs" aria-label="Filter by district">
          <option>All districts</option>
        </select>
        <select className="input-field-light max-w-xs" aria-label="Filter by risk category">
          <option>All risk categories</option>
        </select>
      </div>
      <div className="card-surface overflow-hidden">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-surface">
            <tr>
              <th className="px-4 py-3 text-ocean">Rank</th>
              <th className="px-4 py-3 text-ocean">Barangay</th>
              <th className="px-4 py-3 text-ocean">District</th>
              <th className="px-4 py-3 text-ocean">Risk</th>
              <th className="px-4 py-3 text-ocean">Score</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-ocean">
                  No barangays match “{query.trim()}”. Try another name or clear the search.
                </td>
              </tr>
            ) : (
              filtered.map((row, index) => (
                <tr key={row.id} className="border-t border-pale/60">
                  <td className="px-4 py-3 text-foundation">{index + 1}</td>
                  <td className="px-4 py-3">
                    <Link
                      to={`/barangays/${row.barangay.toLowerCase().replace(/\s+/g, '-')}`}
                      className="font-medium text-ocean hover:text-action"
                    >
                      {row.barangay}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-ocean">{row.district}</td>
                  <td className="px-4 py-3">
                    <RiskBadge category={row.riskLevel} />
                  </td>
                  <td className="px-4 py-3 tabular-nums">
                    {(row.dpi * 100).toFixed(0)}%
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
