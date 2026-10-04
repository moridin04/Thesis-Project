// Bars for the highest DPI barangays, each linking to a profile.
// The public overview page passes the filtered top rows.
// High #ef5f55, Medium #f6c25b, Low #5db36b. Fallback #024950.

import { useCallback, useId, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { colors, riskColors } from '../../theme/colors'

const TICKS = [0, 25, 50, 75, 100]
const VISIBLE_ROWS = 5
const COLUMNS = 'grid grid-cols-[6.25rem_minmax(0,1fr)] items-center gap-3 sm:grid-cols-[8.5rem_minmax(0,1fr)]'
const GRID_LINES = 'repeating-linear-gradient(to right, var(--border-teal) 0 1px, transparent 1px 25%)'
/* Scroll area and axis share the same gutter so ticks stay aligned with the bars. */
const GUTTER = 'pr-2 [scrollbar-gutter:stable] [scrollbar-width:thin]'
const TOOLTIP_ROOM = 104

// Draws the bars, the axis, and a tip that follows the active row.
export default function TopBarangaysChart({ rows }) {
  const descriptionId = useId()
  const rootRef = useRef(null)
  const activeRef = useRef(null)
  const [tip, setTip] = useState(null)
  const [atEnd, setAtEnd] = useState(false)
  const [overflows, setOverflows] = useState(false)
  const stretch = rows.length <= VISIBLE_ROWS

  // Measures whether the list is taller than the visible area.
  const scrollRef = useCallback((el) => {
    if (!el) return undefined
    const measure = () => setOverflows(el.scrollHeight > el.clientHeight + 1)
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  // Place the tip above the row when it would run past the card.
  function showTip(el, row) {
    activeRef.current = { el, row }
    const root = rootRef.current.getBoundingClientRect()
    const rect = el.getBoundingClientRect()
    const above = rect.bottom - root.top + TOOLTIP_ROOM > root.height
    setTip({ row, above, top: above ? rect.top - root.top - 4 : rect.bottom - root.top + 4 })
  }

  // Clear the tip when the pointer or focus leaves the row.
  function hideTip() {
    activeRef.current = null
    setTip(null)
  }

  // Track the end of the list, and keep the tip on the active row.
  function handleScroll(event) {
    const el = event.currentTarget
    setAtEnd(el.scrollTop + el.clientHeight >= el.scrollHeight - 1)
    if (activeRef.current) showTip(activeRef.current.el, activeRef.current.row)
  }

  // Fade at the bottom only while more rows sit below the fold.
  const showFade = overflows && !atEnd

  return (
    <div ref={rootRef} className="relative flex min-h-0 flex-1 flex-col">
      {/* Fills the card; never shorter than the Top 5 height (5 rows of 2rem plus 4 gaps of 0.25rem). */}
      <div className="relative min-h-[11rem] flex-1">
        <div
          ref={scrollRef}
          role="region"
          tabIndex={0}
          aria-label="Highest DPI barangays, scrollable"
          aria-describedby={descriptionId}
          onScroll={handleScroll}
          className={`absolute inset-0 overflow-y-auto rounded-lg outline-none [scrollbar-color:var(--color-pale)_transparent] focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] ${GUTTER}`}
        >
          <ol className={`flex flex-col gap-1 ${stretch ? 'h-full' : ''}`}>
            {rows.map((row) => {
              const score = Math.round(row.priorityScore)
              return (
                <li key={row.id} className={`flex ${stretch ? 'max-h-14 min-h-8 flex-1' : ''}`}>
                  <Link
                    to={`/barangays/${encodeURIComponent(row.id)}`}
                    className={`${COLUMNS} w-full rounded-lg px-1 py-1.5 outline-none transition hover:bg-[var(--color-secondary-soft)] focus-visible:bg-[var(--color-secondary-soft)] focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--focus-ring)]`}
                    aria-label={`${row.barangay}, ${row.district}, ${row.riskLevel} priority, DPI score ${score}. Open profile`}
                    onMouseEnter={(event) => showTip(event.currentTarget, row)}
                    onMouseLeave={hideTip}
                    onFocus={(event) => showTip(event.currentTarget, row)}
                    onBlur={hideTip}
                  >
                    <span className="truncate text-sm text-foundation" title={row.barangay}>
                      {row.barangay}
                    </span>
                    <span
                      className="relative block h-[18px] border-r border-[color:var(--border-teal)]"
                      style={{ backgroundImage: GRID_LINES }}
                    >
                      {/* High #ef5f55, Medium #f6c25b, Low #5db36b, else #024950. */}
                      <span
                        className="absolute inset-y-0 left-0 rounded-r-lg"
                        style={{
                          width: `${Math.max(0, Math.min(100, row.priorityScore))}%`,
                          backgroundColor: riskColors[row.riskLevel] ?? colors.action,
                        }}
                      />
                    </span>
                  </Link>
                </li>
              )
            })}
          </ol>
        </div>
        {showFade ? (
          <div
            className="pointer-events-none absolute inset-x-0 bottom-0 mr-4 h-8 rounded-b-lg bg-gradient-to-t from-[var(--brand-white)] to-transparent"
            aria-hidden="true"
          />
        ) : null}
      </div>
      <div className={`mt-1 overflow-y-hidden ${GUTTER}`} aria-hidden="true">
        <div className={`${COLUMNS} gap-y-1 px-1`}>
          <span />
          <span className="relative block h-[1.375rem] border-t border-muted text-xs text-ocean max-sm:text-[0.6875rem]">
            {TICKS.map((tick) => (
              <span
                key={tick}
                className="absolute top-0 flex -translate-x-1/2 flex-col items-center leading-4"
                style={{ left: `${tick}%` }}
              >
                <span className="h-[5px] w-px bg-muted" />
                {tick}
              </span>
            ))}
          </span>
          <span />
          <span className="text-center text-xs text-muted-ui">DPI score (0–100)</span>
        </div>
      </div>
      <p id={descriptionId} className="sr-only">
        Bar chart of highest DPI barangays, scale 0 to 100
      </p>
      {tip ? (
        <div
          className={`card-surface pointer-events-none absolute left-1 z-20 rounded-lg px-3 py-2 text-sm shadow-lg sm:left-[9.5rem] ${
            tip.above ? '-translate-y-full' : ''
          }`}
          style={{ top: tip.top }}
          role="tooltip"
        >
          <p className="font-medium text-foundation">{tip.row.barangay}</p>
          <p className="text-ocean">{tip.row.district}</p>
          <p className="text-ocean">{tip.row.riskLevel} priority</p>
          <p className="text-ocean">DPI score (0–100): {Math.round(tip.row.priorityScore)}</p>
        </div>
      ) : null}
    </div>
  )
}
