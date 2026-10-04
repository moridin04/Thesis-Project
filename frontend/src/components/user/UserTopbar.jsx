// Top bar for the older user shell, with search and sign out.
// UserLayout is the only parent. Current routes do not use it.
// The name and email come from useAuth.

import { Bell, LogOut, Search } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../auth/useAuth'

// Title, the signed-in name, and a sign-out button.
export default function UserTopbar({ title, subtitle }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  // Signs out, then sends the reader to the login page.
  async function handleLogout() {
    await logout()
    navigate('/login', { replace: true })
  }

  return (
    <header className="fixed left-64 right-0 top-0 z-20 flex h-[4.5rem] items-center justify-between gap-4 border-b border-slate-200/80 bg-white/90 px-6 backdrop-blur-md">
      <div className="min-w-0">
        <h1 className="font-display truncate text-xl font-semibold tracking-tight text-slate-900 sm:text-2xl">
          {title}
        </h1>
        {subtitle ? (
          <p className="truncate text-sm text-slate-500">{subtitle}</p>
        ) : null}
      </div>

      <div className="flex shrink-0 items-center gap-3">
        <label className="relative hidden lg:block">
          <span className="sr-only">Search barangays</span>
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            placeholder="Search barangays…"
            className="w-56 rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-sm text-slate-800 outline-none ring-teal-500/30 placeholder:text-slate-400 focus:border-teal-500 focus:bg-white focus:ring-2"
          />
        </label>
        <button
          type="button"
          className="relative rounded-xl border border-slate-200 bg-white p-2.5 text-slate-600 transition hover:bg-slate-50"
          aria-label="Notifications"
        >
          <Bell className="h-4 w-4" />
        </button>
        <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white py-1.5 pl-1.5 pr-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-teal-600 to-sky-700 text-xs font-bold text-white">
            {user?.full_name?.charAt(0)?.toUpperCase() ?? 'U'}
          </div>
          <div className="hidden leading-tight md:block">
            <p className="text-sm font-medium text-slate-800">
              {user?.full_name ?? 'User'}
            </p>
            <p className="text-[11px] text-slate-500">{user?.email}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleLogout}
          className="rounded-xl border border-slate-200 bg-white p-2.5 text-slate-600 transition hover:bg-slate-50"
          aria-label="Sign out"
          title="Sign out"
        >
          <LogOut className="h-4 w-4" />
        </button>
      </div>
    </header>
  )
}
