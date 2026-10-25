import { Link, NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import './Account.css'

const TABS = [
  { to: '/account/profile', label: 'Edit profile' },
  { to: '/account/security', label: 'Security & Password' },
  { to: '/account/settings', label: 'Account settings' },
]

// Shell for the three account pages.
//
// /account/* is a PUBLIC route on purpose, exactly like /library: a signed-out
// visitor who lands here — from a bookmark, or after logging out with the page
// open — gets an invitation, never an automatic redirect to the login form.
export default function AccountLayout() {
  const { isSignedIn, initializing } = useAuth()

  if (initializing) {
    return (
      <div>
        <h1 className="page-title">Your account</h1>
        <p className="placeholder-note" role="status" aria-live="polite">
          Loading…
        </p>
      </div>
    )
  }

  if (!isSignedIn) {
    return (
      <div className="account-guest">
        <section className="account-guest-card">
          <h1 className="page-title account-guest-title">Your account</h1>
          <p className="account-guest-text">
            Log in to change your display name, review your account details, or update your
            password.
          </p>
          <Link to="/login" state={{ from: '/account/profile' }} className="btn btn-primary btn-lg">
            Log in
          </Link>
          <p className="placeholder-note account-guest-note">
            Browsing, search and reader logs stay open to everyone — no account needed.
          </p>
        </section>
      </div>
    )
  }

  return (
    <div className="account-page">
      <header className="page-head">
        <h1 className="page-title">Your account</h1>
        <p className="page-head-sub">Manage how you appear to other readers and how you sign in.</p>
      </header>

      <nav className="account-tabs" aria-label="Account sections">
        {TABS.map((tab) => (
          <NavLink key={tab.to} to={tab.to} className="account-tab">
            {tab.label}
          </NavLink>
        ))}
      </nav>

      <Outlet />
    </div>
  )
}
