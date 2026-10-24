import { browseGenre } from '../lib/booksApi'
import { useBookList } from '../hooks/useBookList'
import BookListSection from '../components/BookListSection'

// Public landing page — no login required. Shows real "technology" books via
// the Google Books Edge Function, Netflix-style as a horizontal carousel.
const TECH_PARAMS = { genre: 'technology' }

export default function Home() {
  const list = useBookList({ fetchPage: browseGenre, params: TECH_PARAMS, pageSize: 12 })

  return (
    <div>
      <section
        className="card"
        style={{ marginBottom: '2.5rem', padding: '2.5rem' }}
      >
        <h1 style={{ margin: '0 0 0.5rem', fontSize: '2rem' }}>
          Discover your next book
        </h1>
        <p style={{ color: 'var(--color-text-muted)', maxWidth: 560 }}>
          Browse by genre, search by title, and see what other readers are
          saying — no account needed to look around.
        </p>
      </section>

      <BookListSection
        title="Technology"
        layout="carousel"
        emptyMessage="No technology books found right now."
        {...list}
        onLoadMore={list.loadMore}
        onRetry={list.retry}
      />
    </div>
  )
}
