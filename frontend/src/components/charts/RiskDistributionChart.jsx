// Donut of how many barangays fall in each priority class.
// The public overview page passes the counts and the colors.
// Colors are the priority tokens: High #ef5f55, Medium #f6c25b, Low #5db36b.
// A click tells the page which class to filter.

import { useState } from 'react'

const SIZE = 200
const CENTER = SIZE / 2
const OUTER = 82
const INNER = 58
const PAD = (3 * Math.PI) / 180

// Point on the circle. Angle zero is the top, then clockwise.
function point(radius, angle) {
  return [CENTER + radius * Math.sin(angle), CENTER - radius * Math.cos(angle)]
}

// Donut slice between two angles, with a hole in the middle.
function sectorPath(start, end) {
  const large = end - start > Math.PI ? 1 : 0
  const [x0, y0] = point(OUTER, start)
  const [x1, y1] = point(OUTER, end)
  const [x2, y2] = point(INNER, end)
  const [x3, y3] = point(INNER, start)
  return `M${x0} ${y0}A${OUTER} ${OUTER} 0 ${large} 1 ${x1} ${y1}L${x2} ${y2}A${INNER} ${INNER} 0 ${large} 0 ${x3} ${y3}Z`
}

// Full circle used when only one class has a count.
function ringPath() {
  const half = (radius, sweep) =>
    `M${CENTER} ${CENTER - radius}A${radius} ${radius} 0 1 ${sweep} ${CENTER} ${CENTER + radius}A${radius} ${radius} 0 1 ${sweep} ${CENTER} ${CENTER - radius}Z`
  return `${half(OUTER, 1)}${half(INNER, 0)}`
}

// Whole-number percent of the filtered total.
function percent(value, total) {
  return total ? Math.round((value / total) * 100) : 0
}

// Click a slice or a legend row. The page applies the filter.
export default function RiskDistributionChart({ data, centerTotal, selected, onSelect }) {
  const [hovered, setHovered] = useState(null)
  const total = data.reduce((sum, item) => sum + item.value, 0)
  const visible = data.filter((item) => item.value > 0)

  // One class draws a full circle. Several classes leave a small gap.
  const segments = visible.map((item, index) => {
    const before = visible.slice(0, index).reduce((sum, prev) => sum + prev.value, 0)
    const sweep = (item.value / total) * Math.PI * 2
    const start = (before / total) * Math.PI * 2
    const pad = visible.length > 1 ? Math.min(PAD, sweep / 3) / 2 : 0
    return {
      ...item,
      d: visible.length > 1 ? sectorPath(start + pad, start + sweep - pad) : ringPath(),
      mid: start + sweep / 2,
    }
  })

  const active = segments.find((item) => item.name === hovered)
  const tipPos = active ? point((OUTER + INNER) / 2, active.mid) : null

  // Sentence for assistive tech: class, count, and percent.
  function label(item) {
    return `${item.name} priority: ${item.value.toLocaleString()} barangays, ${percent(item.value, total)}% of filtered set`
  }

  return (
    <div className="flex h-full flex-col">
      <div className="relative mx-auto aspect-square w-full max-w-[260px]">
        <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="h-full w-full" role="group" aria-label="Priority distribution">
          {segments.map((item) => (
            <path
              key={item.name}
              d={item.d}
              fill={item.color}
              fillRule="evenodd"
              stroke="transparent"
              strokeWidth={2}
              role="button"
              tabIndex={0}
              aria-label={label(item)}
              aria-pressed={selected === item.name}
              className={`cursor-pointer outline-none transition-opacity focus-visible:stroke-foundation ${
                selected && selected !== item.name ? 'opacity-30' : ''
              }`}
              onClick={() => onSelect(item.name)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault()
                  onSelect(item.name)
                }
              }}
              onMouseEnter={() => setHovered(item.name)}
              onMouseLeave={() => setHovered(null)}
              onFocus={() => setHovered(item.name)}
              onBlur={() => setHovered(null)}
            />
          ))}
        </svg>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <p className="text-xs font-medium uppercase tracking-wider text-ocean/70">Total</p>
          <p className="text-2xl font-semibold text-foundation">{centerTotal.toLocaleString()}</p>
        </div>
        {active ? (
          <div
            className="card-surface pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-[calc(100%+8px)] whitespace-nowrap rounded-lg px-3 py-2 text-sm shadow-lg"
            style={{ left: `${(tipPos[0] / SIZE) * 100}%`, top: `${(tipPos[1] / SIZE) * 100}%` }}
            role="tooltip"
          >
            <p className="font-medium text-foundation">{active.name} priority</p>
            <p className="text-ocean">
              {active.value.toLocaleString()} barangays · {percent(active.value, total)}%
            </p>
          </div>
        ) : null}
      </div>
      <ul className="mt-4 grid gap-2 sm:grid-cols-3">
        {data.map((item) => (
          <li key={item.name}>
            <button
              type="button"
              aria-pressed={selected === item.name}
              onClick={() => onSelect(item.name)}
              className={`flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-sm transition ${
                selected === item.name ? 'bg-pale/60 ring-1 ring-foundation/30' : 'bg-surface hover:bg-pale/40'
              } ${selected && selected !== item.name ? 'opacity-60' : ''}`}
            >
              <span className="flex items-center gap-2 text-ocean">
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} aria-hidden />
                {item.name}
              </span>
              <span className="font-semibold text-foundation">{item.value.toLocaleString()}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
