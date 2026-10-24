import { useId, useState } from 'react'
import { LOG_BODY_MAX, RATING_MAX, RATING_MIN } from '../lib/logsApi'
import './LogForm.css'

const RATING_CHOICES = Array.from(
  { length: RATING_MAX - RATING_MIN + 1 },
  (_, index) => RATING_MIN + index,
)

// One form for both writing and editing a log — the two differ only in their
// starting values and their button label, and keeping them as one component
// means the 4000-character rule and the optional rating can't drift apart
// between the two paths.
//
// The rating really is optional: "No rating" submits null, which is what the
// nullable column expects.
export default function LogForm({
  initialBody = '',
  initialRating = null,
  submitLabel = 'Save log',
  pending = false,
  error = null,
  onSubmit,
  onCancel,
}) {
  // Unique per instance so the composer and an inline edit form can never
  // collide on a DOM id and mis-associate their labels.
  const fieldId = useId()
  const [body, setBody] = useState(initialBody)
  const [rating, setRating] = useState(initialRating ?? '')

  const trimmedLength = body.trim().length
  const tooLong = trimmedLength > LOG_BODY_MAX
  const canSubmit = trimmedLength > 0 && !tooLong && !pending

  function handleSubmit(event) {
    event.preventDefault()
    if (!canSubmit) return
    onSubmit({ body, rating: rating === '' ? null : Number(rating) })
  }

  return (
    <form className="log-form" onSubmit={handleSubmit}>
      <div className="form-field">
        <label htmlFor={`${fieldId}-body`}>Your log</label>
        <textarea
          id={`${fieldId}-body`}
          className="log-form-body"
          rows={5}
          value={body}
          disabled={pending}
          placeholder="What did you read, and what did you think of it?"
          onChange={(event) => setBody(event.target.value)}
        />
        <span className={`form-hint${tooLong ? ' log-form-count-over' : ''}`}>
          {trimmedLength} / {LOG_BODY_MAX} characters
        </span>
      </div>

      <div className="form-field log-form-rating">
        <label htmlFor={`${fieldId}-rating`}>Rating (optional)</label>
        <select
          id={`${fieldId}-rating`}
          className="status-select"
          value={rating}
          disabled={pending}
          onChange={(event) => setRating(event.target.value)}
        >
          <option value="">No rating</option>
          {RATING_CHOICES.map((choice) => (
            <option key={choice} value={choice}>
              {choice} {choice === 1 ? 'star' : 'stars'}
            </option>
          ))}
        </select>
      </div>

      {error && (
        <p className="auth-error" role="alert">
          {error}
        </p>
      )}

      <div className="log-form-actions">
        <button type="submit" className="btn btn-primary" disabled={!canSubmit}>
          {pending ? 'Saving…' : submitLabel}
        </button>
        {onCancel && (
          <button type="button" className="btn btn-secondary" disabled={pending} onClick={onCancel}>
            Cancel
          </button>
        )}
      </div>
    </form>
  )
}
