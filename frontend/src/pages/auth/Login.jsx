import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { AlertTriangle, Eye, EyeOff, LoaderCircle } from 'lucide-react'
import { useAuth } from '../../auth/useAuth'
import { homePathForRole } from '../../config/permissions'
import { RedirectIfAuthenticated } from '../../auth/RoleRoute'
import sagipLogo from '../../assets/sagip-logo.png'

const GENERIC_ERROR = 'Invalid username or password.'

function LoginForm() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
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
      const status = err?.response?.status
      if (!err?.response) {
        setError(
          'Unable to reach the SAGIP API. Start the backend on port 8000 and try again.',
        )
      } else if (status === 429) {
        setError('Too many login attempts. Please wait and try again.')
      } else {
        setError(GENERIC_ERROR)
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="card-surface w-full max-w-md rounded-3xl p-8 shadow-lg">
      <div className="flex items-center gap-3">
        <img
          src={sagipLogo}
          alt="SAGIP Manila logo"
          width={120}
          height={74}
          className="brand-mark max-h-10"
          decoding="async"
        />
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-action">
            Authorized Personnel Access
          </p>
          <h1 className="font-display mt-0.5 text-2xl font-semibold tracking-tight text-foundation">
            SAGIP Staff Portal
          </h1>
        </div>
      </div>

      <div className="disclaimer-soft mt-4 flex gap-3 px-4 py-3 text-sm">
        <AlertTriangle className="disclaimer-soft__icon mt-0.5 h-4 w-4" aria-hidden />
        <p>
          This portal is restricted to authorized SAGIP personnel. Access and
          administrative actions may be recorded for security and accountability.
        </p>
      </div>

      <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
        <div>
          <label htmlFor="username" className="mb-1.5 block text-sm font-medium text-ocean">
            Username
          </label>
          <input
            id="username"
            name="username"
            type="text"
            autoComplete="username"
            required
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            className="input-field"
          />
        </div>
        <div>
          <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-ocean">
            Password
          </label>
          <div className="relative">
            <input
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="input-field pr-12"
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-foundation"
              onClick={() => setShowPassword((value) => !value)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {error ? (
          <p className="rounded-xl border border-[color:var(--risk-high)]/30 bg-[color-mix(in_srgb,var(--accent-soft)_55%,white)] px-4 py-3 text-sm text-foundation">
            {error}
          </p>
        ) : null}

        <button type="submit" disabled={submitting} className="btn-primary w-full disabled:opacity-70">
          {submitting ? <LoaderCircle className="h-4 w-4 animate-spin" /> : null}
          Sign In
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-ocean">
        <Link to="/" className="font-medium text-action hover:text-[color:var(--primary-hover)]">
          Return to Public Website
        </Link>
      </p>
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
