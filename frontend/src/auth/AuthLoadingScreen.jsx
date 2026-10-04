/*
 * Full-screen splash that says the session is restoring.
 * The live routes use components/shared/LoadingScreen instead.
 * Nothing in App or AuthProvider imports this file.
 */
import { Waves } from 'lucide-react'

// Static splash. It does not read the auth state itself.
export default function AuthLoadingScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(ellipse_at_top,_#ecfeff_0%,_#f8fafc_42%,_#f1f5f9_100%)]">
      <div className="flex flex-col items-center gap-4 rounded-2xl border border-slate-200 bg-white px-8 py-10 shadow-sm">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-teal-400 to-sky-600 text-white shadow-md">
          <Waves className="h-6 w-6 animate-pulse" />
        </div>
        <div className="text-center">
          <p className="font-display text-lg font-semibold text-slate-900">
            FloodRisk Manila
          </p>
          <p className="mt-1 text-sm text-slate-500">Restoring your session…</p>
        </div>
      </div>
    </div>
  )
}
