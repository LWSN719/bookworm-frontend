import BookCard from './BookCard'

// Horizontal, Netflix-style row — used for Home's technology section, the
// one place the README explicitly calls out a Netflix-inspired layout.
export default function BookCarousel({ items }) {
  return (
    <div className="book-carousel">
      {items.map((book) => (
        <BookCard key={book.id} book={book} />
      ))}
    </div>
  )
}
