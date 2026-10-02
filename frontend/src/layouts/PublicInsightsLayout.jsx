import { useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { BarChart2, Database, FileText, List, Menu } from 'lucide-react'
import PublicHeader from '../components/public/PublicHeader'

const links = [
  { to: '/barangays/Barangay%20310', label: 'Barangay Profiles', icon: FileText, match: '/barangays' },
  { to: '/compare', label: 'Compare', icon: BarChart2, match: '/compare' },
  { to: '/rankings', label: 'Priority List', icon: List, match: '/rankings' },
  { to: '/methodology', label: 'Data Sources', icon: Database, match: '/methodology' },
]

function navClass(active) {
  return `flex items-center gap-3 rounded-r-lg px-4 py-2.5 text-sm font-medium transition ${
    active
      ? 'border-l-2 border-secondary bg-white/10 text-white'
      : 'border-l-2 border-transparent text-white/75 hover:bg-white/5 hover:text-white'
  }`
}

export default function PublicInsightsLayout() {
  const location = useLocation()
  const [open, setOpen] = useState(false)

  function isActive(match) {
    return location.pathname === match || location.pathname.startsWith(`${match}/`) || location.pathname.startsWith(match)
  }

  const sidebar = (
    <div className="flex h-full flex-col bg-foundation text-white">
      <nav className="flex-1 px-2" aria-label="Insights">
        {/* Header height = --public-header-height plus its 1px bottom border. */}
        <div className="space-y-1 pt-4 lg:sticky lg:top-[calc(var(--public-header-height)+1px)] lg:max-h-[calc(100vh-var(--public-header-height)-1px)] lg:overflow-y-auto">
          {links.map((item) => {
            const Icon = item.icon
            const active = isActive(item.match)
            return (
              <NavLink
                key={item.label}
                to={item.to}
                className={navClass(active)}
                onClick={() => setOpen(false)}
              >
                <Icon className="h-4 w-4 shrink-0" aria-hidden />
                {item.label}
              </NavLink>
            )
          })}
        </div>
      </nav>
      <div className="relative mt-auto px-4 pb-6 pt-8">
        <svg
          viewBox="0 0 240 70"
          className="pointer-events-none absolute inset-x-0 bottom-0 h-16 w-full text-white/15"
          aria-hidden
        >
          <path
            fill="currentColor"
            d="M0 70V42h18v-16h14v16h10V28h22v14h8V18h16v24h12V34h20v8h16V22h18v20h14V40h18v30H0z"
          />
        </svg>
        <p className="relative text-center text-[0.62rem] font-semibold uppercase leading-tight tracking-[0.14em] text-white/80">
          Data for a safer, stronger Manila
        </p>
      </div>
    </div>
  )

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <PublicHeader />
      <div className="flex min-h-0 flex-1">
        <aside className="hidden w-60 shrink-0 lg:block">{sidebar}</aside>

        {open ? (
          <div className="fixed inset-0 z-[70] lg:hidden">
            <button
              type="button"
              className="absolute inset-0 bg-foundation/40"
              aria-label="Close menu"
              onClick={() => setOpen(false)}
            />
            <aside className="relative h-full w-64 shadow-xl">{sidebar}</aside>
          </div>
        ) : null}

        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex items-center border-b border-pale px-4 py-2 lg:hidden">
            <button
              type="button"
              className="rounded-lg p-2 text-foundation"
              aria-label="Open menu"
              onClick={() => setOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </button>
          </div>
          <main className="flex-1 overflow-auto px-4 py-6 sm:px-8">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  )
}
