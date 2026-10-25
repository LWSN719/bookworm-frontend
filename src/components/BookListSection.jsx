import BookCarousel from './BookCarousel'
import BookGrid from './BookGrid'
import AutoLoadMore from './AutoLoadMore'
import LoadMoreButton from './LoadMoreButton'
import { LoadingState, EmptyState, ErrorState } from './ListStates'
import './BookListSection.css'

// Orchestrates one list's loading/empty/error/loaded states plus paging, so
// Home/Search/Genre each have a single call site instead of repeating the
// state-to-UI mapping three times. Props are exactly the useBookList() return
// shape (spread in by the caller) plus a few display options.
//
// `autoLoad` swaps the Load More button for a sentinel that fetches as the
// reader reaches the end — the README allows either. Both paths call the
// same onLoadMore, so paging behaviour is identical; only the trigger
// differs. Search leaves it off: a result set you asked for by name reads
// better as a finite answer than an endless feed.
export default function BookListSection({
  title,
  layout = 'grid',
  emptyMessage = 'No books found.',
  autoLoad = false,
  items,
  phase,
  error,
  hasMore,
  isLoadingMore,
  loadMoreError,
  onLoadMore,
  onRetry,
}) {
  const paging = { hasMore, isLoadingMore, loadMoreError, onLoadMore }

  return (
    <section className="book-list-section">
      {title && <h2 className="book-list-title">{title}</h2>}

      {phase === 'loading' && <LoadingState />}
      {phase === 'error' && <ErrorState error={error} onRetry={onRetry} />}
      {phase === 'empty' && <EmptyState message={emptyMessage} />}

      {phase === 'loaded' && (
        <>
          {layout === 'carousel' ? (
            <BookCarousel items={items} autoLoad={autoLoad ? paging : null} />
          ) : (
            <BookGrid items={items} />
          )}

          {layout !== 'carousel' && autoLoad && <AutoLoadMore {...paging} />}

          {!autoLoad && (hasMore || loadMoreError) && (
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
