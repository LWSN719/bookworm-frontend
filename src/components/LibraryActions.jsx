import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import StatusSelect from './StatusSelect'
import './LibraryActions.css'

// Library controls for one book, shown on the book details page.
//
// Three states: signed out (an invitation, never a redirect), signed in and
// not saved (add), signed in and saved (status + remove). Guests see a plain
// link that only navigates if they choose to click it — the page itself stays
// entirely public and unchanged for them.
//
// `library` is supplied by the page rather than fetched here, so these
// controls and the log controls below them share a single membership answer
// and one request.
export default function LibraryActions({ library }) {
  const { isSignedIn, initializing } = useAuth()
  const location = useLocation()

  // Don't flash the signed-out invitation at someone whose session is still
  // being restored.
  if (initializing) return null

  if (!isSignedIn) {
    return (
      <div className="library-actions">
        <Link
          to="/login"
          state={{ from: `${location.pathname}${location.search}` }}
          className="btn btn-secondary"
        >
          Log in to save this book
        </Link>
      </div>
    )
  }

  if (library.phase === 'error') {
    return (
      <div className="library-actions">
        <p className="library-actions-error" role="alert">
          {library.loadError ?? 'Could not check your library. Please try again.'}
        </p>
        <button type="button" className="btn btn-secondary" onClick={library.retry}>
          Try again
        </button>
      </div>
    )
  }

  // 'ready' is the ONLY state where we actually know whether this book is
  // saved. Anything else — loading, or the defensive 'idle' case — must not
  // render a verdict: falling through would show "Add to my library" for a
  // book that may well already be in the library.
  if (library.phase !== 'ready') {
    return (
      <div className="library-actions">
        <p className="library-actions-note" role="status" aria-live="polite">
          Checking your library…
        </p>
      </div>
    )
  }

  function handleRemove() {
    // Removing cascades to any logs this user wrote for this book, so make
    // that consequence explicit before it happens.
    const confirmed = window.confirm(
      'Remove this book from your library? Any logs you wrote for it will be deleted too.',
    )
    if (confirmed) library.remove()
  }

  return (
    <div className="library-actions">
      {library.inLibrary ? (
        <>
          <span className="library-actions-label">In your library</span>
          <StatusSelect
            value={library.entry.status}
            disabled={library.pending}
            onChange={(status) => library.changeStatus(status)}
          />
          <button
            type="button"
            className="btn btn-secondary"
            disabled={library.pending}
            onClick={handleRemove}
          >
            {library.pending ? 'Working…' : 'Remove'}
          </button>
        </>
      ) : (
        <button
          type="button"
          className="btn btn-primary"
          disabled={library.pending}
          onClick={library.add}
        >
          {library.pending ? 'Adding…' : 'Add to my library'}
        </button>
      )}

      {library.actionError && (
        <p className="library-actions-error" role="alert">
          {library.actionError}
        </p>
      )}
    </div>
  )
}
