import { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { DISPLAY_NAME_MAX, updateDisplayName } from '../../lib/profileApi'

// Display name is the one editable field. Email is shown but not editable:
// changing it is an auth-level flow with its own confirmation emails, and
// this redesign deliberately leaves the auth setup alone.
export default function EditProfile() {
  const { user, displayName, applyProfile } = useAuth()

  const [name, setName] = useState(displayName ?? '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [saved, setSaved] = useState(false)

  // The context resolves the profile a moment after mount, so seed the field
  // once the real name arrives rather than leaving it stuck on ''.
  useEffect(() => {
    setName(displayName ?? '')
  }, [displayName])

  const trimmed = name.trim()
  const tooLong = trimmed.length > DISPLAY_NAME_MAX
  const unchanged = trimmed === (displayName ?? '')
  const canSave = trimmed.length > 0 && !tooLong && !unchanged && !saving

  async function handleSubmit(event) {
    event.preventDefault()
    if (!canSave) return

    setSaving(true)
    setError(null)
    setSaved(false)

    const result = await updateDisplayName({ userId: user?.id ?? null, displayName: trimmed })
    setSaving(false)

    if (!result.ok) {
      setError(result.message)
      return
    }

    // Updates the navbar, greeting and avatar at once. Reading logs show the
    // new name on their next fetch — they read it through the profiles join
    // rather than storing a copy, so nothing has to be rewritten.
    applyProfile(result.profile)
    setSaved(true)
  }

  return (
    <section className="account-card">
      <h2 className="account-card-title">Edit profile</h2>
      <p className="account-card-sub">
        Your display name is what other readers see on your logs. Your email is never shown.
      </p>

      <form onSubmit={handleSubmit}>
        <div className="form-field">
          <label htmlFor="display-name">Display name</label>
          <input
            id="display-name"
            type="text"
            autoComplete="nickname"
            value={name}
            maxLength={DISPLAY_NAME_MAX + 10}
            disabled={saving}
            onChange={(event) => {
              setName(event.target.value)
              setSaved(false)
            }}
          />
          <span className={tooLong ? 'form-hint account-hint-over' : 'form-hint'}>
            {trimmed.length} / {DISPLAY_NAME_MAX} characters
          </span>
        </div>

        <div className="form-field">
          <label htmlFor="account-email">Email</label>
          <input id="account-email" type="email" value={user?.email ?? ''} readOnly disabled />
          <span className="form-hint">
            Your email is used to sign in and is never shown to other readers.
          </span>
        </div>

        {error && (
          <p className="auth-error" role="alert">
            {error}
          </p>
        )}

        {saved && !error && (
          <p className="account-success" role="status">
            Display name updated.
          </p>
        )}

        <button type="submit" className="btn btn-primary" disabled={!canSave}>
          {saving ? 'Saving…' : 'Save changes'}
        </button>
      </form>
    </section>
  )
}
