import { NavLink } from 'react-router-dom'
import { ClipboardList, FileOutput, ScrollText, Users } from 'lucide-react'
import { useAuth } from '../../auth/useAuth'
import { adminNavItemsForRole } from '../../config/adminNav'

const NAV_ICONS = {
  'review-uploads': ClipboardList,
  'public-exports': FileOutput,
  'manage-users': Users,
  'audit-log': ScrollText,
}

export default function AdminSidebar() {
  const { account } = useAuth()
  const navItems = adminNavItemsForRole(account?.role)

  return (
    <aside className="portal-sidebar workspace-sidebar fixed bottom-0 left-0 top-[var(--public-header-height)] z-20 flex w-64 flex-col">
      <div className="border-b border-[color:var(--border-blue)] px-5 py-5">
        <p className="font-display text-lg font-semibold text-foundation">Admin Panel</p>
        <p className="text-xs text-muted">Review and governance</p>
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
