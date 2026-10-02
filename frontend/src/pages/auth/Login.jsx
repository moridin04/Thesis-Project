import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  AlertTriangle,
  LoaderCircle,
  Lock,
  User,
} from 'lucide-react'
import { useAuth } from '../../auth/useAuth'
import { homePathForRole } from '../../config/permissions'
import { RedirectIfAuthenticated } from '../../auth/RoleRoute'

const GENERIC_ERROR = 'Invalid username or password.'
const RATE_LIMIT_ERROR = 'Too many attempts. Please try again later.'

const inputClassName =
  'w-full rounded-xl border border-gray-200 bg-white/60 py-2.5 pl-11 pr-4 text-foundation shadow-sm transition-all placeholder:text-muted focus:border-action focus:outline-none focus:ring-2 focus:ring-action/40'

function LoginForm() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    if (submitting) return
    setError('')
    setSubmitting(true)
    try {
      const account = await login({ username, password })
      const requested = location.state?.from?.pathname
      let next = homePathForRole(account.role)
      if (requested?.startsWith('/dashboard') && ['staff', 'admin'].includes(account.role)) {
        next = requested
      } else if (requested?.startsWith('/admin') && account.role === 'admin') {
        next = requested
      }
      navigate(next, { replace: true })
    } catch (err) {
      // Never render backend text here: only the two fixed messages (plus a network notice).
      if (!err?.response) {
        setError(
          'Unable to reach the AGOS API. Start the backend on port 8000 and try again.',
        )
      } else {
        setError(err.response.status === 429 ? RATE_LIMIT_ERROR : GENERIC_ERROR)
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="w-full max-w-[420px] rounded-3xl border border-white/40 bg-white/70 p-8 shadow-2xl shadow-foundation/10 backdrop-blur-xl md:p-10">
      <h1 className="font-display text-xl font-bold tracking-tight text-foundation md:text-2xl">
        AGOS Staff Portal
      </h1>
      <p className="mt-1.5 mb-5 text-sm text-gray-500">Sign in to continue</p>

      <div className="mb-6 flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50/80 p-3.5 text-sm text-foundation">
        <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600" aria-hidden />
        <p>Restricted to authorized AGOS personnel only.</p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="space-y-5">
          <div>
            <label htmlFor="username" className="mb-1.5 block text-sm font-medium text-gray-700">
              Username
            </label>
            <div className="relative">
              <User
                className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
                aria-hidden
              />
              <input
                id="username"
                name="username"
                type="text"
                autoComplete="username"
                required
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                className={inputClassName}
              />
            </div>
          </div>

          <div>
            <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-gray-700">
              Password
            </label>
            <div className="relative">
              <Lock
                className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
                aria-hidden
              />
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className={inputClassName}
              />
            </div>
          </div>
        </div>

        {error ? (
          <p role="alert" className="mt-5 rounded-xl border border-[color:var(--risk-high)]/30 bg-[color-mix(in_srgb,var(--accent-soft)_55%,white)] px-4 py-3 text-sm text-foundation">
            {error}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={submitting}
          className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-foundation py-3 font-semibold text-white shadow-lg shadow-foundation/20 transition-all hover:scale-[1.01] hover:bg-action focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--focus-ring)] disabled:pointer-events-none disabled:opacity-70"
        >
          {submitting ? <LoaderCircle className="h-4 w-4 animate-spin" /> : null}
          Sign In
        </button>
      </form>
    </div>
  )
}

export default function Login() {
  return (
    <RedirectIfAuthenticated>
      <LoginForm />
    </RedirectIfAuthenticated>
  )
}
