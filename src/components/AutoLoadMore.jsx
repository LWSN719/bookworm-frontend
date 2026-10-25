import { useAutoLoadMore } from '../hooks/useAutoLoadMore'
import LoadMoreButton from './LoadMoreButton'

// The end-of-list marker that pulls the next page in.
//
// It renders one of three things, never more:
//   - a spinner line while a page is arriving
//   - a retry button if a page failed (auto-loading stops on error, so a
//     broken endpoint is never hammered in a loop)
//   - a manual button once the auto-load budget is spent
// and otherwise just an invisible sentinel.
export default function AutoLoadMore({
  hasMore,
  isLoadingMore,
  loadMoreError,
  onLoadMore,
  rootRef,
  rootMargin,
  horizontal = false,
}) {
  const hasError = Boolean(loadMoreError)
  const { sentinelRef, paused, resume } = useAutoLoadMore({
    enabled: hasMore,
    hasMore,
    isLoadingMore,
    hasError,
    onLoadMore,
    rootRef,
    rootMargin,
  })

  if (!hasMore && !hasError) return null

  return (
    <div className={horizontal ? 'autoload autoload-horizontal' : 'autoload'} ref={sentinelRef}>
      {isLoadingMore && (
        <span className="autoload-status" role="status" aria-live="polite">
          <span className="autoload-spinner" aria-hidden="true" />
          Loading more books…
        </span>
      )}

      {!isLoadingMore && hasError && (
        <>
          <span className="load-more-error-text">{loadMoreError.message}</span>
          <LoadMoreButton onClick={resume} loading={false} label="Try again" />
        </>
      )}

      {!isLoadingMore && !hasError && paused && (
        <LoadMoreButton onClick={resume} loading={false} label="Load more" />
      )}
    </div>
  )
}
