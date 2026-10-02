import { NavLink } from 'react-router-dom'
import {
  Activity,
  AlertTriangle,
  LayoutDashboard,
  Map,
  Settings,
  Waves,
} from 'lucide-react'

const navItems = [
  { to: '/', label: 'Overview', icon: LayoutDashboard, end: true },
  { to: '/priority-map', label: 'Priority Map', icon: Map },
  { to: '/alerts', label: 'Alerts', icon: AlertTriangle },
  { to: '/models', label: 'Models', icon: Activity },
  { to: '/settings', label: 'Settings', icon: Settings },
]

export default function Sidebar() {
  return (
    <aside className="flex w-64 shrink-0 flex-col border-r border-slate-800/60 bg-slate-950 text-slate-100">
      <div className="flex items-center gap-3 border-b border-slate-800/80 px-5 py-5">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-teal-400 to-sky-600 shadow-lg shadow-teal-900/40">
          <Waves className="h-5 w-5 text-white" />
        </div>
        <div>
          <p className="font-display text-lg font-semibold tracking-tight text-white">
            FloodRisk
          </p>
          <p className="text-xs text-slate-400">Manila City</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
        {navItems.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-teal-500/15 text-teal-300'
                  : 'text-slate-400 hover:bg-slate-900 hover:text-slate-100'
              }`
            }
          >
            <Icon className="h-4 w-4" strokeWidth={2} />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-slate-800/80 p-4">
        <p className="rounded-xl bg-slate-900/80 px-3 py-3 text-xs leading-relaxed text-slate-400">
          Prototype dashboard · mock data for demo use only.
        </p>
      </div>
    </aside>
  )
}
