import { NavLink } from 'react-router-dom'
import {
  BarChart3,
  BrainCircuit,
  GitCompare,
  LayoutDashboard,
  Lightbulb,
  Upload,
} from 'lucide-react'

const navItems = [
  { to: '/dashboard/overview', label: 'Overview', icon: LayoutDashboard },
  { to: '/dashboard/compare', label: 'Compare', icon: GitCompare },
  { to: '/dashboard/indicators', label: 'Indicators', icon: BarChart3 },
  { to: '/dashboard/recommendations', label: 'Recommendations', icon: Lightbulb },
  { to: '/dashboard/model-results', label: 'Model Results', icon: BrainCircuit },
  { to: '/dashboard/upload', label: 'Upload Data', icon: Upload },
]

export default function DashboardSidebar() {
  return (
    <aside className="portal-sidebar workspace-sidebar fixed bottom-0 left-0 top-[var(--public-header-height)] z-20 flex w-64 flex-col">
      <div className="border-b border-[color:var(--border-blue)] px-5 py-5">
        <p className="font-display text-lg font-semibold text-foundation">Dashboard</p>
        <p className="text-xs text-muted">LGU workspace</p>
      </div>
      <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-4">
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `workspace-nav-link flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                isActive ? 'workspace-nav-link--active' : ''
              }`
            }
          >
            <Icon className="h-4 w-4 shrink-0" />
            <span className="truncate">{label}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}
