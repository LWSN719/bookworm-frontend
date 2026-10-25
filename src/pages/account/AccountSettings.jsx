import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

function formatJoined(isoString) {
  if (!isoString) return 'Unknown'
  return new Date(isoString).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

// A read-only overview. Everything editable lives on the other two tabs, so
// this page never duplicates a form — it just shows what the account is and
// points at where to change it.
export default function AccountSettings() {
  const { user, profile, displayName } = useAuth()

  const rows = [
    { label: 'Email', value: user?.email ?? 'Unknown' },
    { label: 'Display name', value: displayName ?? 'Not set' },
    { label: 'Member since', value: formatJoined(profile?.created_at) },
    { label: 'Account ID', value: user?.id ?? 'Unknown', mono: true },
  ]

  return (
    <section className="account-card">
      <h2 className="account-card-title">Account settings</h2>
      <p className="account-card-sub">Your account at a glance.</p>

      <dl className="account-details">
        {rows.map((row) => (
          <div key={row.label} className="account-detail">
            <dt>{row.label}</dt>
            <dd className={row.mono ? 'account-detail-mono' : undefined}>{row.value}</dd>
          </div>
        ))}
      </dl>

      <div className="account-links">
        <Link to="/account/profile" className="account-link-card">
          <span className="account-link-title">Edit profile</span>
          <span className="account-link-sub">Change your display name</span>
        </Link>
        <Link to="/account/security" className="account-link-card">
          <span className="account-link-title">Security &amp; Password</span>
          <span className="account-link-sub">Update your password</span>
        </Link>
      </div>
    </section>
  )
}
