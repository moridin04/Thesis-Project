import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import PageHeader from '../../components/shared/PageHeader'
import RiskBadge from '../../components/shared/RiskBadge'
import { fetchPublicRankings } from '../../services/publicService'
import { riskLegend } from '../../theme/colors'
import { districtAreaLabel } from '../../utils/districtLabel'

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
        row.district.toLowerCase().includes(needle) ||
        row.area.toLowerCase().includes(needle)
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
        subtitle="Barangays ordered by published DPI score (0–100)"
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
        {/* Below 640px the columns are fixed so all five fit the card: widths cover the "Rank" and
            "Barangay" headers, the "Medium" badge and "(0–100)"; District takes the rest and wraps. */}
        <table className="min-w-full text-left text-sm max-sm:w-full max-sm:table-fixed">
          <thead className="bg-surface">
            <tr>
              <th className="px-4 py-3 text-ocean max-sm:w-[2.875rem] max-sm:px-1.5">Rank</th>
              <th className="px-4 py-3 text-ocean max-sm:w-[4.875rem] max-sm:px-1.5">Barangay</th>
              <th className="px-4 py-3 text-ocean max-sm:px-1.5">District</th>
              <th className="px-4 py-3 text-ocean max-sm:w-20 max-sm:px-1.5">Risk</th>
              <th className="px-4 py-3 text-ocean max-sm:w-[4.25rem] max-sm:px-1.5">DPI score (0–100)</th>
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
              pageRows.map((row) => {
                const districtLabel = districtAreaLabel(row.district, row.area)
                const area = row.area?.trim()
                return (
                  <tr key={row.id} className="border-t border-pale/60">
                    <td className="px-4 py-3 text-foundation max-sm:px-1.5">{row.dpiRank}</td>
                    <td className="px-4 py-3 max-sm:px-1.5">
                      <Link
                        to={`/barangays/${encodeURIComponent(row.id)}`}
                        className="font-medium text-ocean hover:text-action"
                      >
                        {row.barangay}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-ocean max-sm:break-words max-sm:px-1.5" title={districtLabel}>
                      {row.district}
                      {area ? (
                        <>
                          <span className="max-sm:hidden"> -</span>{' '}
                          <span className="max-sm:block">{area}</span>
                        </>
                      ) : null}
                    </td>
                    <td className="px-4 py-3 max-sm:px-1.5">
                      <RiskBadge category={row.riskLevel} />
                    </td>
                    <td className="px-4 py-3 tabular-nums max-sm:px-1.5">
                      {Math.round(row.priorityScore)}
                    </td>
                  </tr>
                )
              })
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
