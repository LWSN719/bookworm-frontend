import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useLibrary } from '../hooks/useLibrary'
import LibraryBookCard from '../components/LibraryBookCard'
import { EmptyState, ErrorState } from '../components/ListStates'

// /library is a PUBLIC route on purpose. Signed-out visitors get an
// invitation, not a redirect — they only reach the login page if they choose
// "Start your library".
//
// Signed in, this shows only the current user's books. That privacy is
// enforced by Stage 2's owner-only RLS policies, not by this component:
// anon holds no privilege on library_items at all.
export default function Library() {
  const { user, isSignedIn, initializing, displayName } = useAuth()

  if (initializing) {
    return (
      <div>
        <h1 className="page-title">My Library</h1>
        <p className="placeholder-note" role="status" aria-live="polite">
          Loading…
        </p>
      </div>
    )
  }

  if (!isSignedIn) {
    return (
      <div>
        <h1 className="page-title">My Library</h1>
        <section className="card" style={{ maxWidth: 560 }}>
          <h2 style={{ margin: '0 0 0.5rem', fontSize: '1.25rem' }}>Build your personal library</h2>
          <p style={{ color: 'var(--color-text-muted)', margin: '0 0 1.25rem' }}>
            Save the books you want to read, track what you're reading now, and write logs about
            what you thought — all kept private to you.
          </p>
          {/* The only path to the login page, and only on an explicit click.
              `from` brings them straight back here once they're in. */}
          <Link to="/login" state={{ from: '/library' }} className="btn btn-primary">
            Start your library
          </Link>
        </section>
        <p className="placeholder-note">
          Browsing, search and reader logs are always open — no account needed for any of it.
        </p>
      </div>
    )
  }

  return <SignedInLibrary userId={user.id} displayName={displayName} />
}

// Split out so the hook is only ever mounted with a real userId, rather than
// being called conditionally (which the rules of hooks forbid).
function SignedInLibrary({ userId, displayName }) {
  const library = useLibrary({ userId })

  function handleRemove(volumeId) {
    // Removing cascades to any logs written for this book — say so first.
    const confirmed = window.confirm(
      'Remove this book from your library? Any logs you wrote for it will be deleted too.',
    )
    if (confirmed) library.remove(volumeId)
  }

  return (
    <div>
      <h1 className="page-title">My Library</h1>

      {library.phase === 'loading' && (
        <p className="placeholder-note" role="status" aria-live="polite">
          Loading your books…
        </p>
      )}

      {library.phase === 'error' && <ErrorState error={library.error} onRetry={library.retry} />}

      {library.phase === 'empty' && (
        <EmptyState message="No books saved yet. Browse or search, then use “Add to my library” on any book." />
      )}

      {library.phase === 'loaded' && (
        <>
          <p className="placeholder-note" style={{ marginTop: 0, marginBottom: '1.5rem' }}>
            {library.entries.length} {library.entries.length === 1 ? 'book' : 'books'} saved by{' '}
            <strong>{displayName ?? 'you'}</strong>.
          </p>
          <div className="library-grid">
            {library.entries.map((entry) => (
              <LibraryBookCard
                key={entry.id}
                entry={entry}
                pending={library.pendingVolumeId === entry.volume_id}
                errorMessage={
                  library.actionError?.volumeId === entry.volume_id
                    ? library.actionError.message
                    : null
                }
                onChangeStatus={library.changeStatus}
                onRemove={handleRemove}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
