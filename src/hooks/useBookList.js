import { useCallback, useEffect, useRef, useState } from 'react'

const DEFAULT_PAGE_SIZE = 20
// Server-side category/title filtering (Stage 3 workaround) can filter an
// entire raw page down to zero items while hasMore is still true — confirmed
// live, not hypothetical. Rather than show a dead-looking "no results" screen
// with real results one page away, auto-advance a bounded number of times.
// The cap exists only to stop a pathological genre from hammering the
// function indefinitely; it is not expected to be hit in normal use.
const MAX_AUTO_CONTINUE = 3

// Shared Load-More state machine for Home/Search/Genre. One hook instead of
// three copies of the same logic, because the one rule that matters —
// pagination keys off the server's `page.hasMore`, never `items.length` — is
// exactly the kind of thing that would silently drift if duplicated. That
// rule exists because of the Stage 3 filtering workaround: a page can come
// back "thin" (fewer items than requested) while more results still exist.
//
// `fetchPage` is searchBooks or browseGenre from src/lib/booksApi.js.
// `params` is the endpoint-specific args, e.g. { q } or { genre }.
export function useBookList({ fetchPage, params, pageSize = DEFAULT_PAGE_SIZE, enabled = true }) {
  const [items, setItems] = useState([])
  const [phase, setPhase] = useState('idle') // idle | loading | loaded | empty | error
  const [error, setError] = useState(null)
  const [hasMore, setHasMore] = useState(false)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [loadMoreError, setLoadMoreError] = useState(null)

  const nextStartIndexRef = useRef(0)
  const abortRef = useRef(null)
  const requestIdRef = useRef(0)
  const autoContinueCountRef = useRef(0)
  const paramsKey = JSON.stringify(params)

  const runFetch = useCallback(
    (startIndex, append) => {
      // Abort whatever's in flight AND bump the request id. Both guards
      // matter: abort stops a fetch that's still pending, while the id check
      // catches a response that slips through anyway (e.g. it had already
      // reached the .then() queue before abort took effect).
      abortRef.current?.abort()
      const controller = new AbortController()
      abortRef.current = controller
      const requestId = ++requestIdRef.current

      if (append) {
        setIsLoadingMore(true)
      } else {
        setPhase('loading')
        setError(null)
      }
      setLoadMoreError(null)

      fetchPage({ ...params, startIndex, maxResults: pageSize, signal: controller.signal })
        .then((result) => {
          if (requestId !== requestIdRef.current) return // superseded by a newer request

          if (result.ok) {
            const hasMoreNow = Boolean(result.page?.hasMore)
            const nextIndex = result.page?.nextStartIndex ?? startIndex
            nextStartIndexRef.current = nextIndex
            setHasMore(hasMoreNow)

            if (append) {
              setItems((prev) => [...prev, ...result.items])
              setIsLoadingMore(false)
              return
            }

            // A thin-to-zero FIRST page with more pages available is not
            // "no results" — it's the filtering workaround discarding an
            // entire raw page. Auto-advance instead of showing a dead empty
            // state when real results may be one page away.
            if (result.items.length === 0 && hasMoreNow && autoContinueCountRef.current < MAX_AUTO_CONTINUE) {
              autoContinueCountRef.current += 1
              runFetch(nextIndex, false)
              return
            }

            autoContinueCountRef.current = 0
            setItems(result.items)
            setPhase(result.items.length === 0 ? 'empty' : 'loaded')
          } else if (append) {
            setIsLoadingMore(false)
            setLoadMoreError({ code: result.code, message: result.message })
          } else {
            setPhase('error')
            setError({ code: result.code, message: result.message })
          }
        })
        .catch((err) => {
          if (err.name === 'AbortError') return // cancelled on purpose, not a failure
          if (requestId !== requestIdRef.current) return
          const fallback = { code: 'network_error', message: 'Something went wrong. Please try again.' }
          if (append) {
            setIsLoadingMore(false)
            setLoadMoreError(fallback)
          } else {
            setPhase('error')
            setError(fallback)
          }
        })
    },
    // paramsKey (the serialized form), not params itself — params is a fresh
    // object every render unless the caller memoizes it, which would defeat
    // the point of a dependency array.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [fetchPage, paramsKey, pageSize],
  )

  useEffect(() => {
    if (!enabled) {
      setItems([])
      setPhase('idle')
      setHasMore(false)
      setError(null)
      return
    }
    setItems([])
    nextStartIndexRef.current = 0
    autoContinueCountRef.current = 0
    runFetch(0, false)
    return () => abortRef.current?.abort()
    // Re-run whenever the params change (new search, new genre) or enabled
    // toggles — always restarting from page 0 so switching genres never
    // shows a mixed list.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paramsKey, enabled])

  const loadMore = useCallback(() => {
    if (!hasMore || isLoadingMore) return
    runFetch(nextStartIndexRef.current, true)
  }, [hasMore, isLoadingMore, runFetch])

  const retry = useCallback(() => {
    nextStartIndexRef.current = 0
    autoContinueCountRef.current = 0
    runFetch(0, false)
  }, [runFetch])

  return { items, phase, error, hasMore, isLoadingMore, loadMoreError, loadMore, retry }
}
