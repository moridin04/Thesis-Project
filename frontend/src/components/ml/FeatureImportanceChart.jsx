import { useState } from 'react'
import { colors } from '../../theme/colors'
import { importanceTicks } from '../../utils/importanceScale'

const GROUP_COLORS = {
  Hazard: colors.secondary,
  Exposure: colors.primary,
  Vulnerability: colors.accent,
}

/* Shared by both importance charts so the label column, rows and axis line up across cards.
   200px labels fit "Flooded area increase (5-yr to 25-yr, sq m)" in two lines; rows hold two lines.
   The plot keeps 9rem so five tick labels never collide; narrower cards scroll instead. */
const COLUMNS = 'grid grid-cols-[8.125rem_minmax(9rem,1fr)] gap-x-3 sm:grid-cols-[12.5rem_minmax(9rem,1fr)]'
const TICK_POSITIONS = [0, 25, 50, 75, 100]

function formatValue(item) {
  const std = item.std != null ? ` ± ${item.std.toFixed(4)}` : ''
  return `${item.importance.toFixed(4)}${std}`
}

/* Renders three rows (plot, axis, legend) so the parent card can place them on a shared subgrid. */
export default function FeatureImportanceChart({ items, label, axisTitle }) {
  const [active, setActive] = useState(null)
  const hasItems = Boolean(items?.length)
  const ticks = importanceTicks(hasItems ? Math.max(...items.map((item) => item.importance)) : 0)
  const max = ticks[ticks.length - 1]

  if (!hasItems) {
    return (
      <>
        <p className="text-sm text-ocean">No importance values were published.</p>
        <div aria-hidden="true" />
        <div aria-hidden="true" />
      </>
    )
  }

  return (
    <>
      <ol aria-label={label} className="relative min-w-0 pr-4">
        <li aria-hidden="true" className={`pointer-events-none absolute inset-y-0 left-0 right-4 ${COLUMNS}`}>
          <span />
          <span className="relative">
            {TICK_POSITIONS.map((position) => (
              <span
                key={position}
                className="absolute inset-y-0 border-l border-dashed border-pale"
                style={{ left: `${position}%` }}
              />
            ))}
          </span>
        </li>
        {items.map((item) => {
          const width = max ? Math.min(100, Math.max(0, (item.importance / max) * 100)) : 0
          const isActive = active === item.feature
          return (
            <li
              key={item.feature}
              tabIndex={0}
              aria-label={`${item.label}, ${item.group}, ${formatValue(item)}`}
              className={`${COLUMNS} relative h-10 items-center rounded-md outline-none hover:bg-[var(--color-secondary-soft)] focus-visible:bg-[var(--color-secondary-soft)] focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--focus-ring)]`}
              onMouseEnter={() => setActive(item.feature)}
              onMouseLeave={() => setActive(null)}
              onFocus={() => setActive(item.feature)}
              onBlur={() => setActive(null)}
            >
              <span className="text-xs leading-4 text-foundation max-sm:text-[0.6875rem] max-sm:leading-[0.8125rem]">
                {item.label}
              </span>
              <span className="relative h-full">
                <span
                  className="absolute left-0 top-1/2 h-4 -translate-y-1/2 rounded-r-lg"
                  style={{ width: `${width}%`, backgroundColor: GROUP_COLORS[item.group] ?? colors.action }}
                />
              </span>
              {isActive ? (
                <span
                  role="tooltip"
                  className="card-surface pointer-events-none absolute left-0 top-full z-20 mt-1 max-w-full rounded-lg px-3 py-2 text-sm shadow-lg"
                >
                  <span className="block font-medium text-foundation">{item.label}</span>
                  <span className="block text-ocean">
                    {item.group} · {formatValue(item)}
                  </span>
                </span>
              ) : null}
            </li>
          )
        })}
      </ol>

      <div aria-hidden="true" className={`${COLUMNS} pr-4`}>
        <span />
        <div>
          <div className="relative h-[1.375rem] border-t border-muted text-xs text-ocean max-sm:text-[0.6875rem]">
            {ticks.map((tick, index) => (
              <span
                key={index}
                className="absolute top-0 flex -translate-x-1/2 flex-col items-center leading-4"
                style={{ left: `${TICK_POSITIONS[index]}%` }}
              >
                <span className="h-[5px] w-px bg-muted" />
                {tick.toFixed(2)}
              </span>
            ))}
          </div>
          <p className="mt-1 text-center text-xs text-muted-ui">{axisTitle}</p>
        </div>
      </div>

      <ul className="flex flex-wrap gap-4 text-xs text-ocean">
        {Object.entries(GROUP_COLORS).map(([group, color]) => (
          <li key={group} className="flex items-center gap-1.5">
            <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: color }} />
            {group}
          </li>
        ))}
      </ul>
    </>
  )
}
