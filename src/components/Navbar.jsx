import { useEffect, useState } from 'react'
import { NavLink } from 'react-router-dom'
import { GENRES } from '../lib/genres'
import { useAuth } from '../context/AuthContext'
import './Navbar.css'

// The wordmark: an open book whose gutter is a red bookmark. Inline SVG so
// it inherits currentColor and costs no extra request.
function BookmarkMark() {
  return (
    <svg className="navbar-mark" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path
        d="M3 4.2c2.9-1 5.8-1 8.6.3v15.3c-2.8-1.3-5.7-1.4-8.6-.4V4.2Zm18 0v15.2c-2.9-1-5.8-.9-8.6.4V4.5c2.8-1.3 5.7-1.4 8.6-.3Z"
        fill="currentColor"
        opacity="0.55"
      />
      <path d="M10.4 2.4h3.2v9.1L12 10l-1.6 1.5V2.4Z" fill="var(--color-accent)" />
    </svg>
  )
}

// "My Library" stays visible to everyone — clicking it shows an invitation
// to create a library, not a forced login. Log In / Sign Up only appear for
// signed-out visitors; nobody is ever redirected to them on arrival.
export default function Navbar() {
  const { isSignedIn, initializing, displayName, signOut } = useAuth()

  // Purely cosmetic: the bar is transparent over a hero and turns solid
  // once the page scrolls. It reads nothing and changes no behaviour.
  const [scrolled, setScrolled] = useState(false)
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  async function handleSignOut() {
    await signOut()
    // Deliberately no redirect: public pages stay readable when signed out,
    // and /library swaps to its welcome view on its own.
  }

  return (
    <header className={scrolled ? 'navbar navbar-solid' : 'navbar'}>
      <div className="navbar-left">
        <NavLink to="/" className="navbar-brand">
          <BookmarkMark />
          <span className="navbar-brand-text">
            Book<span className="navbar-brand-accent">Worm</span>
          </span>
        </NavLink>
        <nav className="navbar-links" aria-label="Genres">
          {GENRES.map((genre) => (
            <NavLink key={genre.slug} to={`/genre/${genre.slug}`}>
              {genre.label}
            </NavLink>
          ))}
        </nav>
      </div>

      <div className="navbar-right">
        <NavLink to="/search" className="navbar-icon-link" aria-label="Search books">
          <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
            <circle cx="11" cy="11" r="6.5" fill="none" stroke="currentColor" strokeWidth="2" />
            <path d="m16 16 4.5 4.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <span className="navbar-icon-label">Search</span>
        </NavLink>
        <NavLink to="/library" className="navbar-text-link">
          My Library
        </NavLink>

        {/* While the session is still being restored, show neither state —
            otherwise a refresh briefly flashes "Log In" at someone who is
            already signed in. */}
        {!initializing &&
          (isSignedIn ? (
            <>
              <span className="navbar-user" title="Signed in">
                <span className="navbar-avatar" aria-hidden="true">
                  {(displayName ?? 'R').trim().charAt(0).toUpperCase()}
                </span>
                <span className="navbar-user-name">{displayName ?? 'Reader'}</span>
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
