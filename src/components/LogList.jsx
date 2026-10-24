import LogCard from './LogCard'
import LogForm from './LogForm'
import { EmptyState, ErrorState } from './ListStates'
import './LogList.css'

// Loading/empty/error/loaded states for a book's reader logs. Reuses Stage
// 4's EmptyState/ErrorState as-is (both already take custom message/error +
// retry); a dedicated loading line here instead of ListStates' LoadingState,
// since that one is book-cover-shaped and says "Loading books…" — the wrong
// fit for a list of text logs.
//
// Every log is rendered for everyone, signed in or not. The only difference
// for the viewer is that their own log carries Edit and Delete.
export default function LogList({
  logs,
  phase,
  error,
  onRetry,
  currentUserId = null,
  editingId = null,
  pendingScope = null,
  actionError = null,
  onStartEdit,
  onCancelEdit,
  onSaveEdit,
  onDelete,
}) {
  if (phase === 'loading') {
    return (
      <div className="log-list-loading" role="status" aria-live="polite">
        <p>Loading reader logs…</p>
      </div>
    )
  }

  if (phase === 'error') {
    return <ErrorState error={error} onRetry={onRetry} />
  }

  if (phase === 'empty') {
    return <EmptyState message="No reader logs yet for this book." />
  }

  return (
    <div className="log-list">
      {logs.map((log) => {
        const isOwn = currentUserId !== null && log.user_id === currentUserId
        const errorMessage = actionError?.scope === log.id ? actionError.message : null

        if (isOwn && editingId === log.id) {
          return (
            <LogForm
              key={log.id}
              initialBody={log.body}
              initialRating={log.rating}
              submitLabel="Save changes"
              pending={pendingScope === log.id}
              error={errorMessage}
              onSubmit={(values) => onSaveEdit(log.id, values)}
              onCancel={onCancelEdit}
            />
          )
        }

        return (
          <div key={log.id}>
            <LogCard
              log={log}
              isOwn={isOwn}
              pending={pendingScope === log.id}
              onEdit={() => onStartEdit(log.id)}
              onDelete={() => onDelete(log.id)}
            />
            {errorMessage && (
              <p className="log-card-error" role="alert">
                {errorMessage}
              </p>
            )}
          </div>
        )
      })}
    </div>
  )
}
