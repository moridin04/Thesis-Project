import { Outlet } from 'react-router-dom'
import { Waves } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function AuthLayout() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950 text-slate-100">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_rgba(45,212,191,0.18),_transparent_50%),radial-gradient(ellipse_at_bottom_right,_rgba(14,165,233,0.16),_transparent_45%)]"
        aria-hidden
      />
      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-6xl flex-col px-6 py-8">
        <header className="flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-teal-400 to-sky-600 shadow-lg shadow-teal-900/40">
              <Waves className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="font-display text-lg font-semibold tracking-tight text-white">
                FloodRisk
              </p>
              <p className="text-xs text-slate-400">Manila</p>
            </div>
          </Link>
          <Link
            to="/"
            className="text-sm font-medium text-slate-400 transition hover:text-white"
          >
            Back to home
          </Link>
        </header>
        <main className="flex flex-1 items-center justify-center py-12">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
