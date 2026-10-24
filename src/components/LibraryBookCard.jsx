import { Link } from 'react-router-dom'
import StatusSelect from './StatusSelect'
import './LibraryBookCard.css'

// One saved book in the library grid.
//
// The cover/title link and the controls are siblings, not nested — putting a
// <select> or <button> inside a <Link> would be invalid markup and would
// hijack clicks meant for the controls.
//
// `entry.book` may be null while details are still loading, or if the lookup
// failed. Either way the status and remove controls stay fully usable, so a
// Google outage can't lock someone out of their own library.
export default function LibraryBookCard({ entry, pending, errorMessage, onChangeStatus, onRemove }) {
  const { volume_id: volumeId, status, book, bookFailed } = entry

  const title = book?.title ?? (bookFailed ? 'Title unavailable' : 'Loading…')
  const authorsText = book
    ? book.authors.length > 0
      ? book.authors.join(', ')
      : 'Unknown author'
    : ' '

  return (
    <div className="library-card">
      <Link to={`/books/${volumeId}`} className="library-card-link">
        <div className="library-card-cover">
          {book?.thumbnail ? (
            <img src={book.thumbnail} alt="" loading="lazy" />
          ) : (
            <span className="library-card-cover-fallback">{title}</span>
          )}
        </div>
        <p className="library-card-title" title={title}>
          {title}
        </p>
        <p className="library-card-authors">{authorsText}</p>
      </Link>

      <div className="library-card-controls">
        <StatusSelect
          value={status}
          disabled={pending}
          onChange={(nextStatus) => onChangeStatus(volumeId, nextStatus)}
        />
        <button
          type="button"
          className="library-card-remove"
          disabled={pending}
          onClick={() => onRemove(volumeId)}
        >
          {pending ? 'Working…' : 'Remove'}
        </button>
      </div>

      {errorMessage && (
        <p className="library-card-error" role="alert">
          {errorMessage}
        </p>
      )}
    </div>
  )
}
