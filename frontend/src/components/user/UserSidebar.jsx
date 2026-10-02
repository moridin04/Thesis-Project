import { NavLink, useLocation } from 'react-router-dom'
import {
  BookOpen,
  Building2,
  LayoutDashboard,
  Lightbulb,
  ListOrdered,
  Map,
  Waves,
} from 'lucide-react'

const navItems = [
  { to: '/app/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/priority-map', label: 'Priority Map', icon: Map },
  { to: '/app/rankings', label: 'Rankings', icon: ListOrdered },
  { to: '/app/barangays/sample', label: 'Barangay Detail', icon: Building2 },
  { to: '/app/methodology', label: 'Methodology', icon: BookOpen },
  { to: '/app/recommendations', label: 'Recommendations', icon: Lightbulb },
]

export default function UserSidebar() {
  const { pathname } = useLocation()

  return (
    <aside className="fixed inset-y-0 left-0 z-30 flex w-64 flex-col border-r border-slate-800/70 bg-slate-950 text-slate-100">
      <div className="flex items-center gap-3 border-b border-slate-800/80 px-5 py-5">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-teal-400 to-sky-600 shadow-lg shadow-teal-900/40">
          <Waves className="h-5 w-5 text-white" />
        </div>
        <div>
          <p className="font-display text-lg font-semibold tracking-tight text-white">
            FloodRisk
          </p>
          <p className="text-xs text-slate-400">User workspace</p>
        </div>
      </div>

      <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-4">
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) => {
              const active = to.includes('/barangays/')
                ? pathname.startsWith('/app/barangays/')
                : isActive
              return `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                active
                  ? 'bg-teal-500/15 text-teal-300'
                  : 'text-slate-400 hover:bg-slate-900 hover:text-slate-100'
              }`
            }}
          >
            <Icon className="h-4 w-4 shrink-0" strokeWidth={2} />
            <span className="truncate">{label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-slate-800/80 p-4">
        <p className="rounded-xl bg-slate-900/80 px-3 py-3 text-xs leading-relaxed text-slate-400">
          Public exploration view · mock data for demo.
        </p>
      </div>
    </aside>
  )
}
