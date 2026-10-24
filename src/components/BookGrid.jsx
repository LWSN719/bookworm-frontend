import BookCard from './BookCard'

// Wrapping grid — used for genre and search results, where visitors are
// scanning many results rather than skimming one row. Load More adds rows
// below rather than extending a single horizontal scroll indefinitely.
export default function BookGrid({ items }) {
  return (
    <div className="book-grid">
      {items.map((book) => (
        <BookCard key={book.id} book={book} />
      ))}
    </div>
  )
}
