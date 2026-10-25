import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'

// Matches the minimum Supabase enforces and the one Signup already applies.
const PASSWORD_MIN = 6

export default function Security() {
  const { user, changePassword } = useAuth()

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const [done, setDone] = useState(false)

  function clearFields() {
    setCurrentPassword('')
    setNewPassword('')
    setConfirmPassword('')
  }

  async function handleSubmit(event) {
    event.preventDefault()
    if (submitting) return

    setError(null)
    setDone(false)

    // Checked here so the obvious mistakes cost no round trip. The server
    // remains the authority on everything that matters.
    if (newPassword.length < PASSWORD_MIN) {
      setError(`Your new password must be at least ${PASSWORD_MIN} characters.`)
      return
    }
    if (newPassword !== confirmPassword) {
      setError('The new passwords do not match.')
      return
    }
    if (newPassword === currentPassword) {
      setError('Your new password must be different from your current one.')
      return
    }

    setSubmitting(true)
    const result = await changePassword({ currentPassword, newPassword })
    setSubmitting(false)

    if (!result.ok) {
      setError(result.message)
      return
    }

    // Nothing typed here is kept around once it has served its purpose.
    clearFields()
    setDone(true)
  }

  return (
    <section className="account-card">
      <h2 className="account-card-title">Security &amp; Password</h2>
      <p className="account-card-sub">
        Changing your password requires your current one, so an unattended session can't be used
        to take over the account.
      </p>

      <form onSubmit={handleSubmit}>
        {/* Present but hidden: password managers need the account identity to
            file the updated credential against. */}
        <input
          type="email"
          value={user?.email ?? ''}
          autoComplete="username"
          readOnly
          hidden
          aria-hidden="true"
          tabIndex={-1}
        />

        <div className="form-field">
          <label htmlFor="current-password">Current password</label>
          <input
            id="current-password"
            type="password"
            autoComplete="current-password"
            value={currentPassword}
            disabled={submitting}
            onChange={(event) => setCurrentPassword(event.target.value)}
            required
          />
        </div>

        <div className="form-field">
          <label htmlFor="new-password">New password</label>
          <input
            id="new-password"
            type="password"
            autoComplete="new-password"
            value={newPassword}
            disabled={submitting}
            onChange={(event) => setNewPassword(event.target.value)}
            required
          />
          <span className="form-hint">At least {PASSWORD_MIN} characters.</span>
        </div>

        <div className="form-field">
          <label htmlFor="confirm-password">Confirm new password</label>
          <input
            id="confirm-password"
            type="password"
            autoComplete="new-password"
            value={confirmPassword}
            disabled={submitting}
            onChange={(event) => setConfirmPassword(event.target.value)}
            required
          />
        </div>

        {error && (
          <p className="auth-error" role="alert">
            {error}
          </p>
        )}

        {done && !error && (
          <p className="account-success" role="status">
            Password updated. Use it the next time you log in.
          </p>
        )}

        <button type="submit" className="btn btn-primary" disabled={submitting}>
          {submitting ? 'Updating…' : 'Update password'}
        </button>
      </form>
    </section>
  )
}
