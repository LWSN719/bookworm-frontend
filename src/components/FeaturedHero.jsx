import { Link } from 'react-router-dom'
import './FeaturedHero.css'

// The cinematic landing block. Presentational only: it renders a book the
// page has ALREADY fetched for its first row, so it costs no extra request
// and makes no call of its own. The book's own cover, blurred and scrimmed,
// becomes the backdrop.
//
// `book` null (still loading, or the list failed) renders the skeleton, so
// the page never collapses and never shows a half-built hero.
export default function FeaturedHero({ book }) {
  if (!book) {
    return (
      <section className="hero hero-skeleton" aria-hidden="true">
        <div className="hero-inner">
          <div className="hero-copy">
            <span className="hero-skeleton-line hero-skeleton-eyebrow" />
            <span className="hero-skeleton-line hero-skeleton-title" />
            <span className="hero-skeleton-line hero-skeleton-text" />
            <span className="hero-skeleton-line hero-skeleton-text hero-skeleton-text-short" />
          </div>
          <div className="hero-poster hero-poster-empty" />
        </div>
      </section>
    )
  }

  const authorsText = book.authors.length > 0 ? book.authors.join(', ') : 'Unknown author'

  return (
    <section className="hero">
      {book.thumbnail && (
        // Blurred, heavily scrimmed, aria-hidden: atmosphere, not content.
        <div
          className="hero-backdrop"
          style={{ backgroundImage: `url(${book.thumbnail})` }}
          aria-hidden="true"
        />
      )}
      <div className="hero-scrim" aria-hidden="true" />

      <div className="hero-inner">
        <div className="hero-copy">
          <span className="hero-eyebrow">Featured in Technology</span>
          <h1 className="hero-title">{book.title}</h1>
          {book.subtitle && <p className="hero-subtitle">{book.subtitle}</p>}

          <div className="hero-meta">
            <span className="hero-author">{authorsText}</span>
            {book.publishedDate && (
              <>
                <span className="hero-dot" aria-hidden="true" />
                <span>{String(book.publishedDate).slice(0, 4)}</span>
              </>
            )}
            {book.pageCount && (
              <>
                <span className="hero-dot" aria-hidden="true" />
                <span>{book.pageCount} pages</span>
              </>
            )}
          </div>

          {book.description && <p className="hero-description">{book.description}</p>}

          <div className="hero-actions">
            <Link to={`/books/${book.id}`} className="btn btn-primary btn-lg">
              <svg viewBox="0 0 24 24" aria-hidden="true" className="hero-btn-icon">
                <path d="M8 5.5v13l11-6.5-11-6.5Z" fill="currentColor" />
              </svg>
              View details
            </Link>
            <Link to="/search" className="btn btn-secondary btn-lg">
              Search by title
            </Link>
          </div>
        </div>

        <Link to={`/books/${book.id}`} className="hero-poster" aria-hidden="true" tabIndex={-1}>
          {book.thumbnail ? (
            <img src={book.thumbnail} alt="" />
          ) : (
            <span className="hero-poster-fallback">{book.title}</span>
          )}
        </Link>
      </div>
    </section>
  )
}
