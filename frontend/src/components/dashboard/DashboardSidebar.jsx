// Side menu for the LGU dashboard, under the public header.
// layouts/DashboardLayout renders it for staff and admin.
// Links come from dashboardNavItemsForRole in config/dashboardNav.

import { NavLink } from 'react-router-dom'
import {
  BarChart3,
  BrainCircuit,
  FileText,
  GitCompare,
  LayoutDashboard,
  Lightbulb,
  ListChecks,
  Upload,
} from 'lucide-react'
import { useAuth } from '../../auth/useAuth'
import { dashboardNavItemsForRole } from '../../config/dashboardNav'

const NAV_ICONS = {
  overview: LayoutDashboard,
  compare: GitCompare,
  indicators: BarChart3,
  recommendations: Lightbulb,
  barangays: ListChecks,
  'model-results': BrainCircuit,
  reports: FileText,
  upload: Upload,
}

// Keeps links that the signed-in role is allowed to open.
export default function DashboardSidebar() {
  const { account } = useAuth()
  const navItems = dashboardNavItemsForRole(account?.role)

  return (
    <aside className="portal-sidebar workspace-sidebar fixed bottom-0 left-0 top-[var(--public-header-height)] z-20 flex w-64 flex-col">
      <div className="border-b border-[color:var(--border-blue)] px-5 py-5">
        <p className="font-display text-lg font-semibold text-foundation">Dashboard</p>
        <p className="text-xs text-muted">LGU workspace</p>
      </div>
      <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-4">
        {navItems.map(({ key, to, label }) => {
          const Icon = NAV_ICONS[key]
          return (
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
          )
        })}
      </nav>
    </aside>
  )
}
