import BookCarousel from './BookCarousel'
import BookGrid from './BookGrid'
import LoadMoreButton from './LoadMoreButton'
import { LoadingState, EmptyState, ErrorState } from './ListStates'
import './BookListSection.css'

// Orchestrates one list's loading/empty/error/loaded states plus Load More,
// so Home/Search/Genre each have a single call site instead of repeating the
// state-to-UI mapping three times. Props are exactly the useBookList() return
// shape (spread in by the caller) plus a few display options.
export default function BookListSection({
  title,
  layout = 'grid',
  emptyMessage = 'No books found.',
  items,
  phase,
  error,
  hasMore,
  isLoadingMore,
  loadMoreError,
  onLoadMore,
  onRetry,
}) {
  return (
    <section className="book-list-section">
      {title && <h2 className="book-list-title">{title}</h2>}

      {phase === 'loading' && <LoadingState />}
      {phase === 'error' && <ErrorState error={error} onRetry={onRetry} />}
      {phase === 'empty' && <EmptyState message={emptyMessage} />}

      {phase === 'loaded' && (
        <>
          {layout === 'carousel' ? <BookCarousel items={items} /> : <BookGrid items={items} />}

          {(hasMore || loadMoreError) && (
            <div className="load-more-row">
              {loadMoreError && <span className="load-more-error-text">{loadMoreError.message}</span>}
              {hasMore && (
                <LoadMoreButton
                  onClick={onLoadMore}
                  loading={isLoadingMore}
                  label={loadMoreError ? 'Try again' : 'Load more'}
                />
              )}
            </div>
          )}
        </>
      )}
    </section>
  )
}
