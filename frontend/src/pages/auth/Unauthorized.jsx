// Page for an account that cannot open the requested area.
// App.jsx mounts this at /unauthorized, outside the other layouts.
// It does not read a role and does not call an API.
// Links lead to the public home and the staff dashboard.
import { Link } from 'react-router-dom'
import { ShieldAlert } from 'lucide-react'

// Message plus the two return links.
export default function Unauthorized() {
  return (
    <div className="page-shell-public flex min-h-screen items-center justify-center px-6">
      <div className="card-surface max-w-md p-8 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-risk/10 text-risk">
          <ShieldAlert className="h-6 w-6" />
        </div>
        <h1 className="font-display text-2xl font-semibold text-foundation">
          Unauthorized
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-ocean">
          Your account does not have permission to access that area.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link
            to="/"
            className="rounded-xl border border-pale px-4 py-2.5 text-sm font-semibold text-ocean"
          >
            Public website
          </Link>
          <Link
            to="/dashboard/overview"
            className="rounded-xl bg-action px-4 py-2.5 text-sm font-semibold text-white"
          >
            Dashboard
          </Link>
        </div>
      </div>
    </div>
  )
}
