// Light side menu listing the public insight pages.
// No current layout imports this file.
// The link list is written here. No data module.

import { NavLink } from 'react-router-dom'
import {
  BookOpen,
  GitCompare,
  LayoutDashboard,
  ListOrdered,
  Map,
  SlidersHorizontal,
  Lightbulb,
} from 'lucide-react'

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/priority-map', label: 'Priority Map', icon: Map },
  { to: '/rankings', label: 'Rankings', icon: ListOrdered },
  { to: '/compare', label: 'Compare', icon: GitCompare },
  { to: '/indicators', label: 'Indicators', icon: SlidersHorizontal },
  { to: '/methodology', label: 'Methodology', icon: BookOpen },
  { to: '/recommendations', label: 'Recommendations', icon: Lightbulb },
]

// Renders the AGOS name and the public page links.
export default function PublicSidebar() {
  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-slate-200 bg-white lg:flex">
      <div className="border-b border-slate-200 px-5 py-5">
        <NavLink to="/">
          <span className="font-display text-lg font-semibold text-slate-900">
            AGOS Manila
          </span>
          <p className="text-xs text-slate-500">Flood priority mapping and prioritization</p>
        </NavLink>
      </div>
      <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-4">
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-teal-50 text-teal-700'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`
            }
          >
            <Icon className="h-4 w-4 shrink-0" />
            {label}
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}
