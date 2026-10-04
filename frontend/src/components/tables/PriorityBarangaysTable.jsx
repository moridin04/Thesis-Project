// Sortable table of barangays, DPI score, and flood share.
// The public overview page shows it under the charts.
// Rows are passed in. District sorting uses utils/districtLabel.

import { Fragment, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react'
import RiskBadge from '../shared/RiskBadge'
import { compareDistrictArea, districtAreaParts } from '../../utils/districtLabel'

const RISK_ORDER = { Low: 0, Medium: 1, High: 2 }

const columns = [
  { key: 'barangay', label: 'Barangay', type: 'text' },
  { key: 'district', label: 'District', type: 'text' },
  { key: 'riskLevel', label: 'Risk', type: 'risk' },
  { key: 'priorityScore', label: 'DPI score (0–100)', type: 'number' },
  { key: 'population', label: 'Population', type: 'number' },
  { key: 'floodPct25yr', label: '25-yr flood', type: 'number' },
]

// Formats a population with Philippine digit grouping.
function formatPopulation(n) {
  return n.toLocaleString('en-PH')
}

// Compares two rows. Risk uses Low, then Medium, then High.
function compare(a, b, column, showArea) {
  if (showArea && column.key === 'district') return compareDistrictArea(a, b)
  const x = a[column.key]
  const y = b[column.key]
  if (column.type === 'text') return String(x).localeCompare(String(y), 'en', { numeric: true })
  if (column.type === 'risk') return (RISK_ORDER[x] ?? -1) - (RISK_ORDER[y] ?? -1)
  if (x == null && y == null) return 0
  if (x == null) return -1
  if (y == null) return 1
  return x - y
}

// Sorts by the clicked column and flips direction on a second click.
export default function PriorityBarangaysTable({ rows, showArea = false }) {
  const navigate = useNavigate()
  const [sort, setSort] = useState({ key: 'priorityScore', dir: 'desc' })
  const sortColumn = columns.find((column) => column.key === sort.key)
  const sorted = [...rows].sort((a, b) => {
    const result = compare(a, b, sortColumn, showArea)
    return sort.dir === 'asc' ? result : -result
  })

  // Flip direction if this column is already active.
  function toggleSort(key) {
    setSort((current) =>
      current.key === key ? { key, dir: current.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'asc' },
    )
  }

  // Profile URL for one barangay id.
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
                  {/* Link click should not also trigger the row navigation. */}
                  <Link
                    to={profilePath(row)}
                    className="whitespace-nowrap hover:text-action"
                    onClick={(event) => event.stopPropagation()}
                  >
                    {row.barangay}
                  </Link>
                </td>
                {/* Keep district and area as separate pieces so each stays intact. */}
                {showArea ? (
                  <td className="px-4 py-3 text-ocean">
                    {districtAreaParts(row.district, row.area).map((part, index) => (
                      <Fragment key={part}>
                        {index ? ' ' : null}
                        <span className="whitespace-nowrap">{part}</span>
                      </Fragment>
                    ))}
                  </td>
                ) : (
                  <td className="whitespace-nowrap px-4 py-3 text-ocean">{row.district}</td>
                )}
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
