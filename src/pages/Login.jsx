import { useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const { isSignedIn, initializing, signIn } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  // Where to land afterwards: back wherever they were sent from, else home.
  // Nobody is ever pushed somewhere they didn't ask to go.
  const returnTo = location.state?.from ?? '/'

  // Already signed in (e.g. opened /login directly) — no point showing a
  // login form. Wait for initializing so a refresh doesn't flash the form.
  if (!initializing && isSignedIn) {
    return <Navigate to={returnTo} replace />
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (submitting) return

    setSubmitting(true)
    setError(null)

    const result = await signIn({ email, password })

    if (!result.ok) {
      setError(result.message)
      setSubmitting(false)
      return
    }

    navigate(returnTo, { replace: true })
  }

  return (
    <div className="auth-form">
      <h1 className="page-title">Log in</h1>

      <form onSubmit={handleSubmit}>
        <div className="form-field">
          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="form-field">
          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        {error && (
          <p className="auth-error" role="alert">
            {error}
          </p>
        )}

        <button
          type="submit"
          className="btn btn-primary"
          style={{ width: '100%' }}
          disabled={submitting}
          aria-busy={submitting}
        >
          {submitting ? 'Logging in…' : 'Log In'}
        </button>
      </form>

      <p className="placeholder-note">
        Need an account?{' '}
        {/* Carry returnTo across, so signing up instead still brings them back. */}
        <Link to="/signup" state={{ from: returnTo }} style={{ color: 'var(--color-accent)' }}>
          Sign up
        </Link>
        .
      </p>
    </div>
  )
}
