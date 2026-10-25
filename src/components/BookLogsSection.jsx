import { useEffect, useMemo, useRef, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useBookLogs } from '../hooks/useBookLogs'
import { useLogActions } from '../hooks/useLogActions'
import LogForm from './LogForm'
import LogList from './LogList'
import './BookLogsSection.css'

// The "Reader logs" block on a book page: everyone's logs, plus — for a
// signed-in user who has this book in their library — the controls for their
// own single log.
//
// `library` is passed in rather than fetched here so this section and
// LibraryActions share one membership answer. Two separate lookups could
// disagree: remove the book with one control and the other would still be
// offering to write a log the database would now refuse.
export default function BookLogsSection({ volumeId, library }) {
  const { user, isSignedIn, initializing } = useAuth()
  const userId = user?.id ?? null

  const bookLogs = useBookLogs({ volumeId })
  const [editingId, setEditingId] = useState(null)
  const [composerOpen, setComposerOpen] = useState(false)

  const actions = useLogActions({
    userId,
    volumeId,
    onSaved: (row) => {
      bookLogs.upsert(row)
      setEditingId(null)
      setComposerOpen(false)
    },
    onRemoved: (id) => {
      bookLogs.drop(id)
      setEditingId(null)
    },
    // The database refused a second log for this book. Close the composer
    // and reload: the existing log then appears with its own Edit/Delete,
    // which is what the writer actually wants.
    onConflict: () => {
      setComposerOpen(false)
      bookLogs.retry()
    },
  })

  // One log per user per book, so this is a find, not a filter.
  const myLog = useMemo(
    () => (userId ? (bookLogs.logs.find((log) => log.user_id === userId) ?? null) : null),
    [bookLogs.logs, userId],
  )

  // Both of these are positive gates on purpose. `isSettled` is false while
  // the list is loading AND when it failed, so a failed fetch can never be
  // read as "this user hasn't written a log yet" and invite a duplicate;
  // likewise library membership is only trusted at phase 'ready'.
  const membershipKnown = library.phase === 'ready'
  const canWrite =
    isSignedIn && !initializing && membershipKnown && library.inLibrary && bookLogs.isSettled

  // Removing the book from the library cascades its log away in the database
  // (logs_library_fkey ... on delete cascade). Mirror that the moment
  // membership flips to false, so the page stops showing a log row that no
  // longer exists on the server.
  const wasInLibraryRef = useRef(false)
  const dropLog = bookLogs.drop
  useEffect(() => {
    if (library.phase !== 'ready') return
    if (wasInLibraryRef.current && !library.inLibrary && myLog) dropLog(myLog.id)
    wasInLibraryRef.current = library.inLibrary
  }, [library.phase, library.inLibrary, myLog, dropLog])

  function handleDelete(logId) {
    const confirmed = window.confirm('Delete your log for this book? This cannot be undone.')
    if (confirmed) actions.remove(logId)
  }

  function handleStartEdit(logId) {
    actions.clearError()
    setComposerOpen(false)
    setEditingId(logId)
  }

  function handleOpenComposer() {
    actions.clearError()
    setEditingId(null)
    setComposerOpen(true)
  }

  return (
    <section className="book-logs">
      <h2 className="book-logs-title">Reader logs</h2>

      {canWrite && !myLog && (
        <div className="book-logs-compose">
          {composerOpen ? (
            <LogForm
              submitLabel="Publish log"
              pending={actions.pendingScope === 'create'}
              error={actions.error?.scope === 'create' ? actions.error.message : null}
              onSubmit={(values) => actions.create(values)}
              onCancel={() => {
                actions.clearError()
                setComposerOpen(false)
              }}
            />
          ) : (
            <button type="button" className="btn btn-primary" onClick={handleOpenComposer}>
              Write a log
            </button>
          )}
        </div>
      )}

      {/* Signed in, book confirmed NOT saved: say why there's no composer.
          Only ever shown once membership is actually known — never guessed
          from a failed lookup. */}
      {isSignedIn && !initializing && membershipKnown && !library.inLibrary && (
        <p className="book-logs-note">
          Add this book to your library to write a log about it.
        </p>
      )}

      {canWrite && myLog && !composerOpen && (
        <p className="book-logs-note">
          You have a log for this book. Use Edit or Delete on it below to change it.
        </p>
      )}

      <LogList
        logs={bookLogs.logs}
        phase={bookLogs.phase}
        error={bookLogs.error}
        onRetry={bookLogs.retry}
        currentUserId={userId}
        editingId={editingId}
        pendingScope={actions.pendingScope}
        actionError={actions.error}
        onStartEdit={handleStartEdit}
        onCancelEdit={() => {
          actions.clearError()
          setEditingId(null)
        }}
        onSaveEdit={(logId, values) => actions.update(logId, values)}
        onDelete={handleDelete}
      />
    </section>
  )
}
