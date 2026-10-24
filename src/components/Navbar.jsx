import { NavLink } from 'react-router-dom'
import { GENRES } from '../lib/genres'
import { useAuth } from '../context/AuthContext'
import './Navbar.css'

// "My Library" stays visible to everyone — clicking it shows an invitation
// to create a library, not a forced login. Log In / Sign Up only appear for
// signed-out visitors; nobody is ever redirected to them on arrival.
export default function Navbar() {
  const { isSignedIn, initializing, displayName, signOut } = useAuth()

  async function handleSignOut() {
    await signOut()
    // Deliberately no redirect: public pages stay readable when signed out,
    // and /library swaps to its welcome view on its own.
  }

  return (
    <header className="navbar">
      <div className="navbar-left">
        <NavLink to="/" className="navbar-brand">
          BookWorm
        </NavLink>
        <nav className="navbar-links">
          {GENRES.map((genre) => (
            <NavLink key={genre.slug} to={`/genre/${genre.slug}`}>
              {genre.label}
            </NavLink>
          ))}
        </nav>
      </div>

      <div className="navbar-right">
        <NavLink to="/search" className="navbar-search-link">
          Search
        </NavLink>
        <NavLink to="/library" className="navbar-search-link">
          My Library
        </NavLink>

        {/* While the session is still being restored, show neither state —
            otherwise a refresh briefly flashes "Log In" at someone who is
            already signed in. */}
        {!initializing &&
          (isSignedIn ? (
            <>
              <span className="navbar-user" title="Signed in">
                {displayName ?? 'Reader'}
              </span>
              <button type="button" className="btn btn-secondary" onClick={handleSignOut}>
                Log Out
              </button>
            </>
          ) : (
            <>
              <NavLink to="/login" className="btn btn-secondary">
                Log In
              </NavLink>
              <NavLink to="/signup" className="btn btn-primary">
                Sign Up
              </NavLink>
            </>
          ))}
      </div>
    </header>
  )
}
