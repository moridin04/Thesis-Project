// Frame for the sign-in page: logo, return link, and the form slot.
// App.jsx mounts this layout on /login.
// The form is the Login page. This layout does not call auth.
import { Outlet, Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import BrandLogo from '../components/shared/BrandLogo'

// Logo and return link above the Outlet, where Login renders.
export default function AuthLayout() {
  return (
    <div className="page-shell-auth page-clip-x relative min-h-screen overflow-hidden">
      {/* Soft decorative glows */}
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <div className="absolute -left-24 top-[-10%] h-72 w-72 rounded-full bg-pale/50 blur-3xl" />
        <div className="absolute -right-16 top-1/4 h-80 w-80 rounded-full bg-secondary/25 blur-3xl" />
        <div className="absolute bottom-[-8%] left-1/3 h-64 w-64 rounded-full bg-white/60 blur-3xl" />
      </div>

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-6xl flex-col px-6 py-6 sm:py-8">
        <header className="flex shrink-0 items-center justify-between gap-4 bg-transparent">
          <Link
            to="/"
            aria-label="AGOS Manila home"
            className="rounded-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/70"
          >
            <BrandLogo variant="white" />
          </Link>
          <Link
            to="/"
            className="group inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3.5 py-1.5 text-sm font-medium text-white/90 backdrop-blur-sm transition-all hover:bg-white/20 hover:text-white"
          >
            <ArrowLeft
              className="h-4 w-4 transition-transform group-hover:-translate-x-0.5"
              aria-hidden
            />
            Return to Public Website
          </Link>
        </header>
        <main className="flex flex-1 items-center justify-center py-8 sm:py-10">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
