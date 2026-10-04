// Top bar for layout/Layout, with a title, search, and a bell.
// Only that layout uses it. The search box does not call an API.
// The name on the right is a static Ops Desk label.

import { Bell, Search } from 'lucide-react'

// Shows the page title and a search box that is not wired up.
export default function Topbar({ title, subtitle }) {
  return (
    <header className="sticky top-0 z-20 flex flex-wrap items-center justify-between gap-4 border-b border-slate-200/80 bg-white/85 px-6 py-4 backdrop-blur-md">
      <div>
        <h1 className="font-display text-2xl font-semibold tracking-tight text-slate-900">
          {title}
        </h1>
        {subtitle ? (
          <p className="mt-0.5 text-sm text-slate-500">{subtitle}</p>
        ) : null}
      </div>

      <div className="flex items-center gap-3">
        <label className="relative hidden sm:block">
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
          <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-rose-500" />
        </button>
        <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white py-1.5 pl-1.5 pr-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-teal-600 to-sky-700 text-xs font-bold text-white">
            FR
          </div>
          <div className="hidden leading-tight md:block">
            <p className="text-sm font-medium text-slate-800">Ops Desk</p>
            <p className="text-[11px] text-slate-500">City Hall</p>
          </div>
        </div>
      </div>
    </header>
  )
}
