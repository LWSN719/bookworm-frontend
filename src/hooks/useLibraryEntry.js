import { useCallback, useEffect, useRef, useState } from 'react'
import {
  addToLibrary as apiAdd,
  getLibraryEntry,
  removeFromLibrary as apiRemove,
  updateStatus as apiUpdateStatus,
} from '../lib/libraryApi'

// Whether one specific book is in the signed-in user's library, plus the
// add/status/remove actions for it. Used by the book details page.
//
// Guests never trigger a query at all: with no userId the hook settles into
// 'idle' immediately, so a logged-out visitor's book page makes zero extra
// requests and nothing about it changes.
export function useLibraryEntry({ userId, volumeId }) {
  const [entry, setEntry] = useState(null)
  const [phase, setPhase] = useState('idle') // idle | loading | ready | error
  const [pending, setPending] = useState(false)
  const [actionError, setActionError] = useState(null)
  // Why the membership lookup itself failed — kept separate from
  // actionError, which belongs to add/status/remove.
  const [loadError, setLoadError] = useState(null)

  const abortRef = useRef(null)
  const requestIdRef = useRef(0)

  const runFetch = useCallback(async () => {
    if (!userId || !volumeId) {
      setEntry(null)
      setPhase('idle')
      return
    }

    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller
    const requestId = ++requestIdRef.current

    setPhase('loading')
    setActionError(null)
    setLoadError(null)

    try {
      const result = await getLibraryEntry({ userId, volumeId, signal: controller.signal })
      if (requestId !== requestIdRef.current) return

      if (!result.ok) {
        setPhase('error')
        setLoadError(result.message)
        return
      }

      setEntry(result.item)
      setPhase('ready')
    } catch (err) {
      if (err?.name === 'AbortError') return
      if (requestId !== requestIdRef.current) return
      setPhase('error')
      setLoadError('Could not check your library. Please try again.')
    }
  }, [userId, volumeId])

  useEffect(() => {
    runFetch()
    return () => abortRef.current?.abort()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, volumeId])

  const add = useCallback(async () => {
    setPending(true)
    setActionError(null)

    const result = await apiAdd({ userId, volumeId })
    setPending(false)

    if (!result.ok) {
      setActionError(result.message)
      // A duplicate means our view of membership was stale — resync rather
      // than leaving the button insisting the book isn't saved.
      if (result.code === '23505') runFetch()
      return
    }

    setEntry(result.item)
    setPhase('ready')
  }, [userId, volumeId, runFetch])

  const changeStatus = useCallback(
    async (status) => {
      setPending(true)
      setActionError(null)

      const result = await apiUpdateStatus({ userId, volumeId, status })
      setPending(false)

      if (!result.ok) {
        setActionError(result.message)
        return
      }

      setEntry(result.item)
    },
    [userId, volumeId],
  )

  const remove = useCallback(async () => {
    setPending(true)
    setActionError(null)

    const result = await apiRemove({ userId, volumeId })
    setPending(false)

    if (!result.ok) {
      setActionError(result.message)
      return
    }

    setEntry(null)
  }, [userId, volumeId])

  return {
    entry,
    // Only meaningful once phase === 'ready'. Before that we don't know
    // whether the book is saved, and callers must not guess.
    inLibrary: entry !== null,
    phase,
    pending,
    actionError,
    loadError,
    add,
    changeStatus,
    remove,
    retry: runFetch,
  }
}
