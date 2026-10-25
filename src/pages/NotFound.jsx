import { Link } from 'react-router-dom'
import './NotFound.css'

export default function NotFound() {
  return (
    <div className="notfound">
      <span className="notfound-code" aria-hidden="true">
        404
      </span>
      <h1 className="page-title notfound-title">We couldn't find that page</h1>
      <p className="notfound-text">
        The link may be broken, or the book may have been shelved somewhere else.
      </p>
      <div className="notfound-actions">
        <Link to="/" className="btn btn-primary">
          Back home
        </Link>
        <Link to="/search" className="btn btn-secondary">
          Search by title
        </Link>
      </div>
    </div>
  )
}
