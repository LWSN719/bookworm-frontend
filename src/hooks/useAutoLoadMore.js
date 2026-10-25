import { useCallback, useEffect, useRef, useState } from 'react'

// How many times in a row the loader may fire without the sentinel ever
// leaving view. A page can append as few as one book (the Stage 3 filtering
// workaround discards most of a raw page), which leaves the sentinel still
// on screen and would otherwise fetch again immediately — burning a run of
// Edge Function calls in one burst. After this many, auto-loading pauses and
// a normal button appears, so loading more stays the reader's choice.
const MAX_CONSECUTIVE_AUTO_LOADS = 4

// Turns "the reader reached the end of the list" into a loadMore() call.
//
// This is a trigger, nothing more: it calls the same `loadMore` the button
// called, so pagination, request shape and the hasMore contract in
// useBookList are completely unchanged.
//
// `rootRef` is the scrolling element to watch within — the carousel's track
// for a horizontal row. Omit it to watch the viewport, which is what a
// vertically scrolling grid wants.
export function useAutoLoadMore({ enabled, hasMore, isLoadingMore, hasError, onLoadMore, rootRef, rootMargin }) {
  const sentinelRef = useRef(null)
  const [visible, setVisible] = useState(false)
  const [paused, setPaused] = useState(false)
  const burstRef = useRef(0)

  useEffect(() => {
    const node = sentinelRef.current
    if (!node || !enabled) return undefined

    const observer = new IntersectionObserver(
      ([entry]) => setVisible(entry.isIntersecting),
      {
        root: rootRef?.current ?? null,
        // Start fetching slightly before the reader actually arrives, so the
        // next books are usually there by the time they get there.
        rootMargin: rootMargin ?? '0px 0px 400px 0px',
        threshold: 0,
      },
    )
    observer.observe(node)
    return () => observer.disconnect()
    // rootRef.current is read at subscribe time; the ref object itself is stable.
  }, [enabled, rootRef, rootMargin])

  // The sentinel scrolling out of view means the last fetch added enough to
  // push it past the reader — the burst is over, so the budget resets and a
  // pause lifts.
  useEffect(() => {
    if (visible) return
    burstRef.current = 0
    setPaused(false)
  }, [visible])

  // One effect owns the decision to fetch. The observer only reports
  // visibility; this re-evaluates whenever a load finishes, which is what
  // continues a sequence the observer itself can't re-fire (visibility never
  // changed, so it emits no new entry).
  useEffect(() => {
    if (!enabled || !visible || !hasMore || isLoadingMore || hasError || paused) return

    if (burstRef.current >= MAX_CONSECUTIVE_AUTO_LOADS) {
      setPaused(true)
      return
    }

    burstRef.current += 1
    onLoadMore()
  }, [enabled, visible, hasMore, isLoadingMore, hasError, paused, onLoadMore])

  // Used by the fallback button: an explicit click is the reader asking, so
  // the budget starts over.
  const resume = useCallback(() => {
    burstRef.current = 0
    setPaused(false)
    onLoadMore()
  }, [onLoadMore])

  return { sentinelRef, paused, resume }
}
