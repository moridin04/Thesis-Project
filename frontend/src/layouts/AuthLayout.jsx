import { Outlet, Link } from 'react-router-dom'
import BrandLogo from '../components/shared/BrandLogo'

export default function AuthLayout() {
  return (
    <div className="page-shell-auth page-clip-x relative min-h-screen">
      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-6xl flex-col px-6 py-8">
        <header className="flex items-center justify-between gap-4">
          <Link
            to="/"
            aria-label="SAGIP Manila home"
            className="rounded-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--focus-ring)]"
          >
            <BrandLogo />
          </Link>
          <Link
            to="/"
            className="text-sm font-medium text-ocean transition hover:text-action"
          >
            Return to Public Website
          </Link>
        </header>
        <main className="flex flex-1 items-center justify-center py-12">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
