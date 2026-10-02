import { useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { BarChart2, Database, FileText, Info, List, Menu } from 'lucide-react'
import PublicHeader from '../components/public/PublicHeader'
import SidebarSkyline from '../components/public/SidebarSkyline'

const links = [
  { to: '/barangays/Barangay%20310', label: 'Barangay Profiles', icon: FileText, match: '/barangays' },
  { to: '/compare', label: 'Compare', icon: BarChart2, match: '/compare' },
  { to: '/rankings', label: 'Priority List', icon: List, match: '/rankings' },
  { to: '/methodology', label: 'Data Sources', icon: Database, match: '/methodology' },
  { to: '/about', label: 'About', icon: Info, match: '/about' },
]

const tagline = ['People', 'Places', 'Progress', 'Together']

function pillClass(active) {
  return `flex min-h-15 items-center gap-5 rounded-lg px-4 text-base font-medium transition ${
    active
      ? 'bg-white/10 text-white'
      : 'text-white/75 group-hover:bg-white/5 group-hover:text-white'
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
      <nav className="flex-1" aria-label="Insights">
        {/* Header height = --public-header-height plus its 1px bottom border.
            Max height also reserves 9.5rem for the tagline block so the menu never slides under the header. */}
        <div className="flex flex-col gap-2 pt-5 lg:sticky lg:top-[calc(var(--public-header-height)+1px)] lg:max-h-[calc(100vh-var(--public-header-height)-1px-9.5rem)] lg:overflow-y-auto">
          {links.map((item) => {
            const Icon = item.icon
            const active = isActive(item.match)
            return (
              <NavLink
                key={item.label}
                to={item.to}
                className="group relative block px-3"
                onClick={() => setOpen(false)}
              >
                {active ? (
                  <span className="absolute inset-y-0 left-0 w-1.5 bg-secondary" aria-hidden="true" />
                ) : null}
                <span className={pillClass(active)}>
                  <Icon className="h-6 w-6 shrink-0" aria-hidden="true" />
                  {item.label}
                </span>
              </NavLink>
            )
          })}
        </div>
      </nav>
      <div className="mt-auto pt-6">
        <SidebarSkyline className="text-pale opacity-30 [@media(max-height:699.98px)]:hidden" />
        <p className="pb-6 pl-6 pt-4 text-xs font-medium uppercase leading-[1.8] tracking-[0.3em] text-white/60">
          {tagline.map((word) => (
            <span key={word} className="block">
              {word}
            </span>
          ))}
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
            <aside className="relative h-full w-64 overflow-y-auto bg-foundation shadow-xl">{sidebar}</aside>
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
