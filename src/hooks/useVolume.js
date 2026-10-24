import { useCallback, useEffect, useRef, useState } from 'react'

// Single-volume fetch for the book details page. Same cancellation/request-id
// discipline as useBookList.js, simplified: one item, no pagination.
//
// `fetchVolume` is getVolume from src/lib/booksApi.js.
export function useVolume({ fetchVolume, volumeId }) {
  const [book, setBook] = useState(null)
  const [phase, setPhase] = useState('loading') // loading | loaded | error
  const [error, setError] = useState(null)

  const abortRef = useRef(null)
  const requestIdRef = useRef(0)

  const runFetch = useCallback(() => {
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller
    const requestId = ++requestIdRef.current

    setPhase('loading')
    setError(null)

    fetchVolume({ volumeId, signal: controller.signal })
      .then((result) => {
        if (requestId !== requestIdRef.current) return // superseded by a newer request

        if (result.ok) {
          setBook(result.item)
          setPhase('loaded')
        } else {
          setPhase('error')
          setError({ code: result.code, message: result.message })
        }
      })
      .catch((err) => {
        if (err.name === 'AbortError') return // cancelled on purpose, not a failure
        if (requestId !== requestIdRef.current) return
        setPhase('error')
        setError({ code: 'network_error', message: 'Something went wrong. Please try again.' })
      })
  }, [fetchVolume, volumeId])

  useEffect(() => {
    runFetch()
    return () => abortRef.current?.abort()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [volumeId])

  return { book, phase, error, retry: runFetch }
}
