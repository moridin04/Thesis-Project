import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { MapPinned, Search } from 'lucide-react'
import { riskLegend } from '../../theme/colors'

export default function FloodRiskOverviewPanel() {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')

  function handleSearch(event) {
    event.preventDefault()
    const trimmed = query.trim()
    navigate(trimmed ? `/rankings?q=${encodeURIComponent(trimmed)}` : '/rankings')
  }

  return (
    <aside className="relative w-full overflow-hidden rounded-2xl border border-pale/35 bg-ocean shadow-[0_20px_50px_rgba(0,49,53,0.35)]">
      <div
        className="pointer-events-none absolute -right-10 -top-16 h-56 w-56 rounded-full bg-action/30 blur-3xl"
        aria-hidden
      />
      <div className="relative border-b border-pale/20 px-5 py-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-pale/90">
              Spatial preview
            </p>
            <h2 className="mt-1 font-display text-xl font-semibold text-white">
              Flood Risk Overview
            </h2>
          </div>
          <MapPinned className="h-5 w-5 shrink-0 text-action" aria-hidden />
        </div>
        <p className="mt-2 text-xs leading-relaxed text-pale/80">
          Decorative geospatial sketch for orientation only — not a geographically
          accurate Manila map.
        </p>
      </div>

      <div className="relative px-5 pt-4">
        <div
          className="relative h-52 overflow-hidden rounded-xl border border-pale/25 bg-foundation/70 sm:h-56"
          aria-hidden
        >
          <svg
            className="absolute inset-0 h-full w-full"
            viewBox="0 0 400 240"
            preserveAspectRatio="xMidYMid slice"
            role="presentation"
          >
            <defs>
              <pattern id="geo-grid" width="28" height="28" patternUnits="userSpaceOnUse">
                <path
                  d="M 28 0 L 0 0 0 28"
                  fill="none"
                  stroke="#AFDDE5"
                  strokeOpacity="0.18"
                  strokeWidth="1"
                />
              </pattern>
            </defs>
            <rect width="400" height="240" fill="url(#geo-grid)" />
            <path
              d="M20 180 C70 150 110 200 160 170 C210 140 240 110 290 130 C330 145 360 120 390 100"
              fill="none"
              stroke="#AFDDE5"
              strokeOpacity="0.45"
              strokeWidth="1.5"
            />
            <path
              d="M10 120 C60 90 100 140 150 115 C200 90 250 70 310 95 C350 110 370 80 400 70"
              fill="none"
              stroke="#0FA4AF"
              strokeOpacity="0.4"
              strokeWidth="1.25"
            />
            <path
              d="M40 40 C90 60 120 30 170 55 C220 80 260 45 320 65 C355 78 375 55 400 50"
              fill="none"
              stroke="#AFDDE5"
              strokeOpacity="0.28"
              strokeWidth="1"
            />
            <ellipse cx="130" cy="145" rx="42" ry="28" fill="#964734" fillOpacity="0.35" />
            <ellipse cx="130" cy="145" rx="28" ry="18" fill="#964734" fillOpacity="0.45" />
            <ellipse cx="240" cy="100" rx="36" ry="24" fill="#0FA4AF" fillOpacity="0.28" />
            <ellipse cx="300" cy="165" rx="40" ry="26" fill="#024950" fillOpacity="0.9" stroke="#AFDDE5" strokeOpacity="0.5" />
            <circle cx="132" cy="145" r="5" fill="#0FA4AF" />
            <circle cx="132" cy="145" r="9" fill="none" stroke="#0FA4AF" strokeWidth="1.5" />
            <circle cx="242" cy="100" r="4" fill="#AFDDE5" />
            <circle cx="302" cy="165" r="4" fill="#AFDDE5" />
            <path
              d="M180 200 Q220 185 260 205 Q300 220 340 195"
              fill="none"
              stroke="#AFDDE5"
              strokeOpacity="0.35"
              strokeWidth="1.25"
              strokeDasharray="4 5"
            />
          </svg>
          <p className="absolute bottom-2 left-2 rounded bg-foundation/70 px-2 py-1 text-[10px] font-medium uppercase tracking-wide text-pale/90">
            Abstract preview
          </p>
        </div>

        <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-xs text-pale">
          {riskLegend.map((item) => (
            <li key={item.label} className="inline-flex items-center gap-2">
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: item.color }}
                aria-hidden
              />
              <span>{item.label}</span>
            </li>
          ))}
        </ul>

        <div className="mt-4 grid grid-cols-2 gap-2">
          <div className="rounded-lg border border-pale/20 bg-foundation/40 px-3 py-2">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-pale/70">
              Demo focus
            </p>
            <p className="mt-0.5 text-sm font-semibold text-white">High-risk zones</p>
          </div>
          <div className="rounded-lg border border-pale/20 bg-foundation/40 px-3 py-2">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-pale/70">
              Demo marker
            </p>
            <p className="mt-0.5 text-sm font-semibold text-action">Active selection</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSearch} className="relative space-y-2 border-t border-pale/20 p-5">
        <label htmlFor="barangay-search" className="block text-sm font-medium text-pale">
          Search barangay
        </label>
        <div className="flex gap-2">
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-pale/70" />
            <input
              id="barangay-search"
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="e.g. Baseco"
              className="input-field pl-10"
            />
          </div>
          <button type="submit" className="btn-primary shrink-0 px-4">
            Search
          </button>
        </div>
        <Link
          to="/barangays/baseco-compound"
          className="inline-flex text-sm font-medium text-action hover:text-pale"
        >
          View sample barangay profile
        </Link>
      </form>
    </aside>
  )
}
