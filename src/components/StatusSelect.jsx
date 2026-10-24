import { READING_STATUSES, STATUS_LABELS } from '../lib/libraryApi'

// Shared reading-status control, used on both the library grid and the book
// details page so the two surfaces can never drift apart. Options come
// straight from READING_STATUSES, which mirrors the DB CHECK constraint.
export default function StatusSelect({ value, onChange, disabled = false, id }) {
  return (
    <select
      id={id}
      className="status-select"
      value={value}
      disabled={disabled}
      aria-label="Reading status"
      onChange={(e) => onChange(e.target.value)}
    >
      {READING_STATUSES.map((status) => (
        <option key={status} value={status}>
          {STATUS_LABELS[status]}
        </option>
      ))}
    </select>
  )
}
