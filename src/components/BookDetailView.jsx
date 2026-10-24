import './BookDetailView.css'

// Presentational — real book data on /books/:id. `book` is the Book shape
// from src/lib/booksApi.js (authors/categories always arrays, thumbnail
// https-or-null, description already HTML-stripped and untruncated here).
export default function BookDetailView({ book }) {
  const authorsText = book.authors.length > 0 ? book.authors.join(', ') : 'Unknown author'

  return (
    <div className="book-detail">
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
        </dl>
      </div>
    </div>
  )
}
