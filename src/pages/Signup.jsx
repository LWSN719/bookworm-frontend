import { useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

// Matches the profiles CHECK constraint in supabase/schema.sql
// (char_length between 1 and 50, trimmed). Validating here means an
// over-long name gets a real message instead of the trigger throwing inside
// signup and surfacing as an opaque "Database error saving new user".
const DISPLAY_NAME_MAX = 50
const PASSWORD_MIN = 6

export default function Signup() {
  const { isSignedIn, initializing, signUp } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [checkEmail, setCheckEmail] = useState(false)

  const returnTo = location.state?.from ?? '/'

  if (!initializing && isSignedIn) {
    return <Navigate to={returnTo} replace />
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (submitting) return

    const trimmedName = displayName.trim()

    if (trimmedName.length === 0) {
      setError('Please enter a display name.')
      return
    }
    if (trimmedName.length > DISPLAY_NAME_MAX) {
      setError(`Display name must be ${DISPLAY_NAME_MAX} characters or fewer.`)
      return
    }
    if (password.length < PASSWORD_MIN) {
      setError(`Password must be at least ${PASSWORD_MIN} characters.`)
      return
    }

    setSubmitting(true)
    setError(null)

    const result = await signUp({ email, password, displayName: trimmedName })

    if (!result.ok) {
      setError(result.message)
      setSubmitting(false)
      return
    }

    // Project requires email confirmation — there's no session yet, so stay
    // put and tell them what to do next rather than silently doing nothing.
    if (result.needsEmailConfirmation) {
      setCheckEmail(true)
      setSubmitting(false)
      return
    }

    navigate(returnTo, { replace: true })
  }

  if (checkEmail) {
    return (
      <div className="auth-form">
        <h1 className="page-title">Check your email</h1>
        <p>
          We sent a confirmation link to <strong>{email}</strong>. Open it to activate your account,
          then log in.
        </p>
        <p className="placeholder-note">
          <Link to="/login" state={{ from: returnTo }} className="auth-link">
            Go to log in
          </Link>
        </p>
      </div>
    )
  }

  return (
    <div className="auth-form">
      <h1 className="page-title">Create your account</h1>
      <p className="auth-form-intro">
        Your display name is what other readers see on your logs — never your email.
      </p>

      <form onSubmit={handleSubmit}>
        <div className="form-field">
          <label htmlFor="displayName">Display name</label>
          <input
            id="displayName"
            type="text"
            autoComplete="nickname"
            maxLength={DISPLAY_NAME_MAX}
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            required
          />
          <span className="form-hint">Shown on your reader logs. Your email is never shown.</span>
        </div>
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
            autoComplete="new-password"
            minLength={PASSWORD_MIN}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <span className="form-hint">At least {PASSWORD_MIN} characters.</span>
        </div>

        {error && (
          <p className="auth-error" role="alert">
            {error}
          </p>
        )}

        <button
          type="submit"
          className="btn btn-primary btn-block"
          disabled={submitting}
          aria-busy={submitting}
        >
          {submitting ? 'Creating account…' : 'Sign Up'}
        </button>
      </form>

      <p className="placeholder-note">
        Already have an account?{' '}
        <Link to="/login" state={{ from: returnTo }} className="auth-link">
          Log in
        </Link>
        .
      </p>
    </div>
  )
}
