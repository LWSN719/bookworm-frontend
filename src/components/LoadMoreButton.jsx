export default function LoadMoreButton({ onClick, loading, label = 'Load more' }) {
  return (
    <button type="button" className="btn btn-secondary" onClick={onClick} disabled={loading} aria-busy={loading}>
      {loading ? 'Loading…' : label}
    </button>
  )
}
