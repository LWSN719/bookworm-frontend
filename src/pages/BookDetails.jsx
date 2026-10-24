import { useParams } from 'react-router-dom'
import { getVolume } from '../lib/booksApi'
import { useAuth } from '../context/AuthContext'
import { useVolume } from '../hooks/useVolume'
import { useLibraryEntry } from '../hooks/useLibraryEntry'
import BookDetailView from '../components/BookDetailView'
import BookLogsSection from '../components/BookLogsSection'
import LibraryActions from '../components/LibraryActions'
import { LoadingState, ErrorState } from '../components/ListStates'

// /books/:id — must work on a direct visit or refresh (the Vercel rewrite in
// vercel.json handles the SPA routing side). Fully public: book data comes
// from the Edge Function (anonymous, Stage 3), reader logs come straight
// from Supabase (publicly readable per Stage 2 RLS) — no login required for
// either. The two fetches are independent: a failed book lookup doesn't hide
// logs that loaded fine, and vice versa, since both are driven by the same
// route param rather than by each other.
//
// The library-membership lookup lives here, one level above the two things
// that need it, so the save controls and the log controls can never disagree
// about whether this book is in the viewer's library. For a signed-out
// visitor it makes no request at all.
export default function BookDetails() {
  const { id } = useParams()
  const { user } = useAuth()

  const volume = useVolume({ fetchVolume: getVolume, volumeId: id })
  const library = useLibraryEntry({ userId: user?.id ?? null, volumeId: id })

  return (
    <div>
      {volume.phase === 'loading' && <LoadingState />}
      {volume.phase === 'error' && <ErrorState error={volume.error} onRetry={volume.retry} />}
      {volume.phase === 'loaded' && <BookDetailView book={volume.book} />}

      {/* Library controls only once the book actually resolved — there's
          nothing meaningful to save if the lookup failed. Guests see an
          invitation here, never a redirect; the rest of the page is
          identical for them. */}
      {volume.phase === 'loaded' && <LibraryActions library={library} />}

      <BookLogsSection volumeId={id} library={library} />
    </div>
  )
}
