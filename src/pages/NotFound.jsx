import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <div>
      <h1 className="page-title">Page not found</h1>
      <Link to="/" className="btn btn-secondary">
        Back home
      </Link>
    </div>
  )
}
