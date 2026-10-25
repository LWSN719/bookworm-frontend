import './LogCard.css'

function formatLogDate(isoString) {
  return new Date(isoString).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

// No new dependency for a 1-5 rating — plain glyphs.
function RatingStars({ rating }) {
  if (!rating) return null
  return (
    <span className="log-card-rating" aria-label={`Rated ${rating} out of 5`}>
      <span className="log-card-stars-filled" aria-hidden="true">
        {'★'.repeat(rating)}
      </span>
      <span className="log-card-stars-empty" aria-hidden="true">
        {'★'.repeat(5 - rating)}
      </span>
    </span>
  )
}

// One public reader log. `log` comes from useBookLogs: { id, user_id, body,
// rating, created_at, profiles: { display_name } | null }. Per README, logs
// show the author's display name — never the email, which isn't in this
// query at all (it lives only in auth.users).
//
// `isOwn` decides what is drawn and nothing more. Whether a write actually
// succeeds is settled by logs_update_own / logs_delete_own matching
// auth.uid() against user_id, so these buttons are a courtesy for the owner,
// not the thing that keeps other people's logs safe.
export default function LogCard({ log, isOwn = false, pending = false, onEdit, onDelete }) {
  const displayName = log.profiles?.display_name ?? 'A reader'

  return (
    <article className={isOwn ? 'log-card log-card-own' : 'log-card'}>
      <div className="log-card-header">
        <span className="log-card-avatar" aria-hidden="true">
          {displayName.trim().charAt(0).toUpperCase()}
        </span>
        <span className="log-card-byline">
          <span className="log-card-author">
            {displayName}
            {isOwn && <span className="log-card-you">your log</span>}
          </span>
          <span className="log-card-date">{formatLogDate(log.created_at)}</span>
        </span>
        <RatingStars rating={log.rating} />
      </div>

      <p className="log-card-body">{log.body}</p>

      {isOwn && (
        <div className="log-card-actions">
          <button type="button" className="btn btn-secondary log-card-action" disabled={pending} onClick={onEdit}>
            Edit
          </button>
          <button type="button" className="btn btn-secondary log-card-action" disabled={pending} onClick={onDelete}>
            {pending ? 'Working…' : 'Delete'}
          </button>
        </div>
      )}
    </article>
  )
}
