import { LogOut } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../auth/useAuth'

export default function AdminTopbar({ title, subtitle }) {
  const { account, logout } = useAuth()
  const navigate = useNavigate()

  async function handleLogout() {
    await logout()
    navigate('/login', { replace: true })
  }

  return (
    <header className="fixed left-64 right-0 top-0 z-20 flex h-[4.5rem] items-center justify-between gap-4 border-b border-[color:var(--border-blue)] bg-white/95 px-6 backdrop-blur-md">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <h1 className="font-display truncate text-xl font-semibold text-foundation">
            {title}
          </h1>
          <span className="hidden rounded-full bg-action/15 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-ocean sm:inline">
            Admin
          </span>
        </div>
        {subtitle ? <p className="truncate text-sm text-ocean">{subtitle}</p> : null}
      </div>
      <div className="flex items-center gap-3">
        <Link
          to="/"
          className="rounded-xl border border-[color:var(--border-blue)] px-3 py-2 text-sm font-medium text-ocean hover:bg-surface"
        >
          Return to Public Site
        </Link>
        <div className="hidden rounded-xl border border-[color:var(--border-blue)] px-3 py-1.5 md:block">
          <p className="text-sm font-medium text-foundation">{account?.full_name}</p>
          <p className="text-[11px] text-ocean">@{account?.username}</p>
        </div>
        <button
          type="button"
          onClick={handleLogout}
          className="rounded-xl border border-[color:var(--border-blue)] p-2.5 text-ocean hover:bg-surface"
          aria-label="Sign out"
        >
          <LogOut className="h-4 w-4" />
        </button>
      </div>
    </header>
  )
}
