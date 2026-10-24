import { useMemo } from 'react'
import { useParams, Navigate } from 'react-router-dom'
import { GENRES, genreLabel } from '../lib/genres'
import { browseGenre } from '../lib/booksApi'
import { useBookList } from '../hooks/useBookList'
import BookListSection from '../components/BookListSection'

// Public genre browse page. The slug-to-Google-query mapping lives entirely
// in the Edge Function (Stage 3); this page just asks for a genre by slug.
export default function Genre() {
  const { slug } = useParams()
  const known = GENRES.some((g) => g.slug === slug)

  // Called unconditionally (Rules of Hooks) even for an unknown slug — the
  // Navigate redirect happens below, after the hook, and `enabled: known`
  // keeps it from ever firing a request for a bad slug.
  const params = useMemo(() => ({ genre: slug }), [slug])
  const list = useBookList({ fetchPage: browseGenre, params, enabled: known })

  if (!known) {
    return <Navigate to="/" replace />
  }

  return (
    <div>
      <h1 className="page-title">{genreLabel(slug)}</h1>
      <BookListSection
        layout="grid"
        emptyMessage={`No ${genreLabel(slug)} books found right now.`}
        {...list}
        onLoadMore={list.loadMore}
        onRetry={list.retry}
      />
    </div>
  )
}
