import { Link } from 'react-router-dom'
import './BookCard.css'

// Real book card — cover, title, author(s), per the README's Home-page
// minimum. The Book shape always has `authors`/`categories` as arrays
// (never null) and `thumbnail` as https-or-null, so no defensive null
// checks are needed beyond what's here.
export default function BookCard({ book }) {
  const authorsText = book.authors.length > 0 ? book.authors.join(', ') : 'Unknown author'

  return (
    <Link to={`/books/${book.id}`} className="book-card">
      <div className="book-card-cover">
        {book.thumbnail ? (
          // alt="" because the title is already rendered as adjacent text —
          // avoids a screen reader announcing it twice.
          <img src={book.thumbnail} alt="" loading="lazy" />
        ) : (
          <span className="book-card-cover-fallback">{book.title}</span>
        )}
        {/* Decorative hover layer. aria-hidden so the "View" affordance
            never reaches assistive tech as if it were a second link. */}
        <span className="book-card-overlay" aria-hidden="true">
          <span className="book-card-overlay-cta">View</span>
        </span>
      </div>
      <p className="book-card-title" title={book.title}>
        {book.title}
      </p>
      <p className="book-card-authors">{authorsText}</p>
    </Link>
  )
}
