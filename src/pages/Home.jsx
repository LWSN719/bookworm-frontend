import { browseGenre } from '../lib/booksApi'
import { useBookList } from '../hooks/useBookList'
import BookListSection from '../components/BookListSection'
import FeaturedHero from '../components/FeaturedHero'

// Public landing page — no login required. Shows real "technology" books via
// the Google Books Edge Function, Netflix-style as a horizontal carousel.
const TECH_PARAMS = { genre: 'technology' }

export default function Home() {
  const list = useBookList({ fetchPage: browseGenre, params: TECH_PARAMS, pageSize: 12 })

  // The hero features a book this page has ALREADY loaded for its row — no
  // second request, and nothing to keep in sync. Until the list resolves (or
  // if it fails) `featured` is null and the hero renders its skeleton, so the
  // error and retry still belong to the row below, where they were.
  //
  // Prefer a book that can actually carry a hero: a cover to blur into the
  // backdrop, a named author, and a blurb. Google's first result is often a
  // scanned volume with none of those, which makes the landing page look
  // broken when it is merely sparse. Falls back to the first item so the
  // hero always appears.
  const featured =
    list.phase === 'loaded'
      ? (list.items.find((b) => b.thumbnail && b.authors.length > 0 && b.description) ??
        list.items.find((b) => b.thumbnail) ??
        list.items[0] ??
        null)
      : null

  return (
    <div>
      <FeaturedHero book={featured} />

      <BookListSection
        title="Technology"
        layout="carousel"
        autoLoad
        emptyMessage="No technology books found right now."
        {...list}
        onLoadMore={list.loadMore}
        onRetry={list.retry}
      />
    </div>
  )
}
