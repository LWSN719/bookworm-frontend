import './ListStates.css'

export function LoadingState() {
  return (
    <div className="list-state list-state-loading" role="status" aria-live="polite">
      <div className="skeleton-row">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="skeleton-card" />
        ))}
      </div>
      <p>Loading books…</p>
    </div>
  )
}

export function EmptyState({ message = 'No books found.' }) {
  return (
    <div className="list-state list-state-empty">
      <p>{message}</p>
    </div>
  )
}

// `error.message` is already friendly text by the time it reaches here —
// src/lib/booksApi.js maps every upstream error code through one shared
// table before it's ever stored in state.
export function ErrorState({ error, onRetry }) {
  return (
    <div className="list-state list-state-error" role="alert">
      <p>{error?.message ?? 'Something went wrong. Please try again.'}</p>
      <button type="button" className="btn btn-secondary" onClick={onRetry}>
        Try again
      </button>
    </div>
  )
}
