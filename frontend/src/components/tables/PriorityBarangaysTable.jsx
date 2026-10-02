import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react'
import RiskBadge from '../shared/RiskBadge'

const RISK_ORDER = { Low: 0, Medium: 1, High: 2 }

const columns = [
  { key: 'barangay', label: 'Barangay', type: 'text' },
  { key: 'district', label: 'District', type: 'text' },
  { key: 'riskLevel', label: 'Risk', type: 'risk' },
  { key: 'priorityScore', label: 'DPI score (0–100)', type: 'number' },
  { key: 'population', label: 'Population', type: 'number' },
  { key: 'floodPct25yr', label: '25-yr flood', type: 'number' },
]

function formatPopulation(n) {
  return n.toLocaleString('en-PH')
}

function compare(a, b, column) {
  const x = a[column.key]
  const y = b[column.key]
  if (column.type === 'text') return String(x).localeCompare(String(y), 'en', { numeric: true })
  if (column.type === 'risk') return (RISK_ORDER[x] ?? -1) - (RISK_ORDER[y] ?? -1)
  if (x == null && y == null) return 0
  if (x == null) return -1
  if (y == null) return 1
  return x - y
}

export default function PriorityBarangaysTable({ rows }) {
  const navigate = useNavigate()
  const [sort, setSort] = useState({ key: 'priorityScore', dir: 'desc' })
  const sortColumn = columns.find((column) => column.key === sort.key)
  const sorted = [...rows].sort((a, b) => {
    const result = compare(a, b, sortColumn)
    return sort.dir === 'asc' ? result : -result
  })

  function toggleSort(key) {
    setSort((current) =>
      current.key === key ? { key, dir: current.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'asc' },
    )
  }

  function profilePath(row) {
    return `/barangays/${encodeURIComponent(row.id)}`
  }

  return (
    <div className="overflow-hidden rounded-xl border border-pale/70">
      <div className="overflow-x-auto">
        <table className="min-w-[680px] w-full divide-y divide-pale/60 text-left text-sm">
          <thead className="bg-surface">
            <tr>
              {columns.map((column) => {
                const active = sort.key === column.key
                const Icon = active ? (sort.dir === 'asc' ? ArrowUp : ArrowDown) : ArrowUpDown
                return (
                  <th
                    key={column.key}
                    scope="col"
                    aria-sort={active ? (sort.dir === 'asc' ? 'ascending' : 'descending') : 'none'}
                    className="px-4 py-3 font-semibold text-ocean"
                  >
                    <button
                      type="button"
                      onClick={() => toggleSort(column.key)}
                      className="inline-flex items-center gap-1.5 whitespace-nowrap rounded hover:text-foundation"
                    >
                      {column.label}
                      <Icon className={`h-3.5 w-3.5 ${active ? 'text-foundation' : 'text-ocean/50'}`} aria-hidden />
                    </button>
                  </th>
                )
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-pale/50 bg-white">
            {sorted.map((row) => (
              <tr
                key={row.id}
                className="cursor-pointer transition-colors hover:bg-surface/80 focus-within:bg-surface/80"
                onClick={() => navigate(profilePath(row))}
              >
                <td className="px-4 py-3 font-medium text-foundation">
                  <Link
                    to={profilePath(row)}
                    className="whitespace-nowrap hover:text-action"
                    onClick={(event) => event.stopPropagation()}
                  >
                    {row.barangay}
                  </Link>
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-ocean">{row.district}</td>
                <td className="px-4 py-3">
                  <RiskBadge category={row.riskLevel} />
                </td>
                <td className="px-4 py-3 tabular-nums text-foundation">
                  {Math.round(row.priorityScore)}
                </td>
                <td className="px-4 py-3 tabular-nums text-ocean">
                  {formatPopulation(row.population)}
                </td>
                <td className="px-4 py-3 tabular-nums text-ocean">
                  {row.floodPct25yr != null
                    ? `${Number(row.floodPct25yr).toFixed(1)}%`
                    : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
