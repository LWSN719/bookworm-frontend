import './BookDetailView.css'

// Presentational — real book data on /books/:id. `book` is the Book shape
// from src/lib/booksApi.js (authors/categories always arrays, thumbnail
// https-or-null, description already HTML-stripped and untruncated here).
export default function BookDetailView({ book }) {
  const authorsText = book.authors.length > 0 ? book.authors.join(', ') : 'Unknown author'

  return (
    <div className="book-detail">
      {book.thumbnail && (
        // The cover doubles as the page's atmosphere: blurred, scrimmed and
        // aria-hidden, so it reads as backdrop rather than as content.
        <div
          className="book-detail-backdrop"
          style={{ backgroundImage: `url(${book.thumbnail})` }}
          aria-hidden="true"
        />
      )}

      <div className="book-detail-body">
        <div className="book-detail-cover">
          {book.thumbnail ? (
            // alt="" — the title is rendered as an adjacent heading, so a
            // screen reader shouldn't announce it twice.
            <img src={book.thumbnail} alt="" />
          ) : (
            <span className="book-detail-cover-fallback">{book.title}</span>
          )}
        </div>

        <div className="book-detail-info">
          <h1 className="book-detail-title">{book.title}</h1>
          {book.subtitle && <p className="book-detail-subtitle">{book.subtitle}</p>}
          <p className="book-detail-authors">{authorsText}</p>

          {book.categories.length > 0 && (
            <ul className="book-detail-tags">
              {book.categories.slice(0, 3).map((category) => (
                <li key={category} className="pill">
                  {category}
                </li>
              ))}
            </ul>
          )}

          {book.description && <p className="book-detail-description">{book.description}</p>}

          {/* README: "at least two additional fields of your choice" */}
          <dl className="book-detail-meta">
            {book.publishedDate && (
              <div className="book-detail-meta-item">
                <dt>Published</dt>
                <dd>{book.publishedDate}</dd>
              </div>
            )}
            {book.pageCount && (
              <div className="book-detail-meta-item">
                <dt>Pages</dt>
                <dd>{book.pageCount}</dd>
              </div>
            )}
            {book.publisher && (
              <div className="book-detail-meta-item">
                <dt>Publisher</dt>
                <dd>{book.publisher}</dd>
              </div>
            )}
            {book.averageRating && (
              <div className="book-detail-meta-item">
                <dt>Readers' rating</dt>
                <dd className="book-detail-rating">
                  <span className="book-detail-star" aria-hidden="true">
                    ★
                  </span>
                  {book.averageRating}
                  {book.ratingsCount ? <span className="book-detail-rating-count"> ({book.ratingsCount})</span> : null}
                </dd>
              </div>
            )}
          </dl>
        </div>
      </div>
    </div>
  )
}
