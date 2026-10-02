import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import PageHeader from '../../components/shared/PageHeader'
import RiskBadge from '../../components/shared/RiskBadge'
import { fetchPublicRankings } from '../../services/publicService'
import { riskLegend } from '../../theme/colors'

const PAGE_SIZE = 20

export default function Rankings() {
  const [priorityBarangays, setPriorityBarangays] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchParams] = useSearchParams()
  const [query, setQuery] = useState(searchParams.get('q') ?? '')
  const [district, setDistrict] = useState('All districts')
  const [priority, setPriority] = useState('All priority levels')
  const [page, setPage] = useState(1)

  useEffect(() => {
    let active = true
    fetchPublicRankings()
      .then((data) => {
        if (active) setPriorityBarangays(data)
      })
      .catch(() => {
        if (active) setError('Unable to load rankings. Check that the API is running.')
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [])

  const districts = useMemo(
    () => [...new Set(priorityBarangays.map((row) => row.district).filter(Boolean))].sort(),
    [priorityBarangays],
  )

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase()
    const level = priority.replace(' Priority', '')
    return priorityBarangays.filter((row) => {
      const matchesQuery =
        !needle ||
        row.barangay.toLowerCase().includes(needle) ||
        row.district.toLowerCase().includes(needle)
      const matchesDistrict = district === 'All districts' || row.district === district
      const matchesPriority = priority === 'All priority levels' || row.riskLevel === level
      return matchesQuery && matchesDistrict && matchesPriority
    })
  }, [query, district, priority, priorityBarangays])

  useEffect(() => {
    setPage(1)
  }, [query, district, priority])

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const currentPage = Math.min(page, pageCount)
  const pageRows = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)

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
        <select
          value={district}
          onChange={(event) => setDistrict(event.target.value)}
          className="input-field-light max-w-xs"
          aria-label="Filter by district"
        >
          <option>All districts</option>
          {districts.map((name) => (
            <option key={name}>{name}</option>
          ))}
        </select>
        <select
          value={priority}
          onChange={(event) => setPriority(event.target.value)}
          className="input-field-light max-w-xs"
          aria-label="Filter by risk category"
        >
          <option>All priority levels</option>
          {riskLegend.map((item) => (
            <option key={item.level}>{item.label}</option>
          ))}
        </select>
      </div>
      {loading ? <p className="text-sm text-ocean">Loading rankings…</p> : null}
      {error ? <p className="text-sm text-accent">{error}</p> : null}
      <ul className="flex flex-wrap gap-3 text-sm text-ocean">
        {riskLegend.map((item) => (
          <li key={item.label} className="inline-flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: item.color }} aria-hidden />
            {item.label}
          </li>
        ))}
      </ul>
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
            {pageRows.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-ocean">
                  No barangays match the current filters.
                </td>
              </tr>
            ) : (
              pageRows.map((row) => (
                <tr key={row.id} className="border-t border-pale/60">
                  <td className="px-4 py-3 text-foundation">{row.dpiRank}</td>
                  <td className="px-4 py-3">
                    <Link
                      to={`/barangays/${row.id}`}
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
      <nav className="flex flex-wrap items-center justify-between gap-3 text-sm" aria-label="Rankings pages">
        <button
          type="button"
          className="rounded-lg border border-pale px-3 py-1.5 text-foundation disabled:opacity-40"
          onClick={() => setPage((value) => Math.max(1, value - 1))}
          disabled={currentPage <= 1}
        >
          Previous
        </button>
        <p className="text-ocean">
          Page {currentPage} of {pageCount}
          {filtered.length ? ` · ${filtered.length} barangays` : ''}
        </p>
        <div className="flex flex-wrap gap-1">
          {Array.from({ length: pageCount }, (_, index) => index + 1)
            .filter((number) => number === 1 || number === pageCount || Math.abs(number - currentPage) <= 2)
            .map((number) => (
              <button
                key={number}
                type="button"
                onClick={() => setPage(number)}
                className={`min-w-8 rounded-lg px-2 py-1.5 ${
                  number === currentPage ? 'bg-foundation text-white' : 'text-foundation hover:bg-pale/60'
                }`}
                aria-current={number === currentPage ? 'page' : undefined}
              >
                {number}
              </button>
            ))}
        </div>
        <button
          type="button"
          className="rounded-lg border border-pale px-3 py-1.5 text-foundation disabled:opacity-40"
          onClick={() => setPage((value) => Math.min(pageCount, value + 1))}
          disabled={currentPage >= pageCount}
        >
          Next
        </button>
      </nav>
    </div>
  )
}
