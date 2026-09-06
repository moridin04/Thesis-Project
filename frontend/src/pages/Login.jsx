import { useNavigate } from 'react-router-dom'
import { Shield, UserRound } from 'lucide-react'

export default function Login() {
  const navigate = useNavigate()

  return (
    <div className="w-full max-w-md rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl shadow-black/40 backdrop-blur-xl">
      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-teal-300/90">
        Demo access
      </p>
      <h1 className="font-display mt-2 text-3xl font-semibold tracking-tight text-white">
        Sign in to FloodRisk
      </h1>
      <p className="mt-3 text-sm leading-relaxed text-slate-400">
        Choose a role to explore the prototype. No credentials required for this
        demo build.
      </p>

      <div className="mt-8 space-y-3">
        <button
          type="button"
          onClick={() => navigate('/app/dashboard')}
          className="flex w-full items-center gap-4 rounded-2xl border border-teal-400/30 bg-teal-500/10 px-4 py-4 text-left transition hover:border-teal-300/50 hover:bg-teal-500/20"
        >
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-teal-400 to-sky-600 text-white shadow-md">
            <UserRound className="h-5 w-5" />
          </span>
          <span>
            <span className="block text-sm font-semibold text-white">
              Continue as User
            </span>
            <span className="mt-0.5 block text-xs text-slate-400">
              Opens /app/dashboard
            </span>
          </span>
        </button>

        <button
          type="button"
          onClick={() => navigate('/admin/dashboard')}
          className="flex w-full items-center gap-4 rounded-2xl border border-sky-400/30 bg-sky-500/10 px-4 py-4 text-left transition hover:border-sky-300/50 hover:bg-sky-500/20"
        >
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500 to-slate-700 text-white shadow-md">
            <Shield className="h-5 w-5" />
          </span>
          <span>
            <span className="block text-sm font-semibold text-white">
              Continue as Admin
            </span>
            <span className="mt-0.5 block text-xs text-slate-400">
              Opens /admin/dashboard
            </span>
          </span>
        </button>
      </div>
    </div>
  )
}
