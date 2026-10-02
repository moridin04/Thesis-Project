import { useState } from 'react'
import { Link } from 'react-router-dom'
import { colors } from '../../theme/colors'

const TICKS = [0, 25, 50, 75, 100]
const COLUMNS = 'grid grid-cols-[6.25rem_minmax(0,1fr)] items-center gap-3 sm:grid-cols-[8.5rem_minmax(0,1fr)]'
const GRID_LINES = `repeating-linear-gradient(to right, ${colors.pale} 0 1px, transparent 1px 25%)`

export default function TopBarangaysChart({ rows }) {
  const [activeId, setActiveId] = useState(null)

  return (
    <div>
      <ol className="space-y-1">
        {rows.map((row) => {
          const score = Math.round(row.priorityScore)
          return (
            <li key={row.id} className="relative">
              <Link
                to={`/barangays/${encodeURIComponent(row.id)}`}
                className={`${COLUMNS} rounded-lg px-1 py-1.5 outline-none transition hover:bg-[var(--color-secondary-soft)] focus-visible:bg-[var(--color-secondary-soft)] focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]`}
                aria-label={`${row.barangay}, ${row.district}, ${row.riskLevel} priority, DPI score ${score}. Open profile`}
                onMouseEnter={() => setActiveId(row.id)}
                onMouseLeave={() => setActiveId(null)}
                onFocus={() => setActiveId(row.id)}
                onBlur={() => setActiveId(null)}
              >
                <span className="truncate text-sm text-foundation" title={row.barangay}>
                  {row.barangay}
                </span>
                <span className="relative block h-[18px] border-r border-pale" style={{ backgroundImage: GRID_LINES }}>
                  <span
                    className="absolute inset-y-0 left-0 rounded-r-lg"
                    style={{ width: `${Math.max(0, Math.min(100, row.priorityScore))}%`, backgroundColor: colors.action }}
                  />
                </span>
              </Link>
              {activeId === row.id ? (
                <div
                  className="card-surface pointer-events-none absolute left-1 top-full z-20 mt-1 rounded-lg px-3 py-2 text-sm shadow-lg sm:left-[9.5rem]"
                  role="tooltip"
                >
                  <p className="font-medium text-foundation">{row.barangay}</p>
                  <p className="text-ocean">{row.district}</p>
                  <p className="text-ocean">{row.riskLevel} priority</p>
                  <p className="text-ocean">DPI score (0–100): {score}</p>
                </div>
              ) : null}
            </li>
          )
        })}
      </ol>
      <div className={`${COLUMNS} mt-1 px-1`} aria-hidden="true">
        <span />
        <span className="relative h-4 text-xs text-ocean">
          {TICKS.map((tick) => (
            <span
              key={tick}
              className={`absolute top-0 ${tick === 0 ? '' : tick === 100 ? '-translate-x-full' : '-translate-x-1/2'}`}
              style={{ left: `${tick}%` }}
            >
              {tick}
            </span>
          ))}
        </span>
      </div>
    </div>
  )
}
