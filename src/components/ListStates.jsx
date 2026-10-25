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
      <svg className="list-state-icon" viewBox="0 0 24 24" aria-hidden="true">
        <path
          d="M4 5.5A2.5 2.5 0 0 1 6.5 3H19v15H6.5A2.5 2.5 0 0 0 4 20.5V5.5Z"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
      </svg>
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
      <svg className="list-state-icon" viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="1.6" />
        <path d="M12 7.5v5.2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <circle cx="12" cy="16.3" r="1.1" fill="currentColor" />
      </svg>
      <p>{error?.message ?? 'Something went wrong. Please try again.'}</p>
      <button type="button" className="btn btn-secondary" onClick={onRetry}>
        Try again
      </button>
    </div>
  )
}
