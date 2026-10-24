import { useCallback, useEffect, useRef, useState } from 'react'
import {
  listLibrary,
  removeFromLibrary as apiRemove,
  updateStatus as apiUpdateStatus,
} from '../lib/libraryApi'
import { getVolume } from '../lib/booksApi'

// The signed-in user's library.
//
// library_items stores only volume_id — no title or cover — so book details
// are hydrated from the Edge Function afterwards, one request per saved book.
// The rows render immediately with working status/remove controls and the
// covers fill in as they arrive: managing your own data must never depend on
// Google being reachable.
export function useLibrary({ userId }) {
  const [entries, setEntries] = useState([])
  const [phase, setPhase] = useState('loading') // loading | loaded | empty | error
  const [error, setError] = useState(null)
  const [pendingVolumeId, setPendingVolumeId] = useState(null)
  const [actionError, setActionError] = useState(null)

  const abortRef = useRef(null)
  const requestIdRef = useRef(0)

  const runFetch = useCallback(async () => {
    if (!userId) {
      setEntries([])
      setPhase('loading')
      return
    }

    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller
    const requestId = ++requestIdRef.current

    setPhase('loading')
    setError(null)
    setActionError(null)

    let result
    try {
      result = await listLibrary({ userId, signal: controller.signal })
    } catch (err) {
      if (err?.name === 'AbortError') return
      if (requestId !== requestIdRef.current) return
      setPhase('error')
      setError({ message: 'Could not load your library. Please try again.' })
      return
    }

    if (requestId !== requestIdRef.current) return

    if (!result.ok) {
      setPhase('error')
      setError({ message: result.message })
      return
    }

    const rows = result.items.map((row) => ({ ...row, book: null, bookFailed: false }))
    setEntries(rows)
    setPhase(rows.length === 0 ? 'empty' : 'loaded')

    // Hydrate covers/titles in parallel, patching each row in as it lands.
    rows.forEach(async (row) => {
      try {
        const volume = await getVolume({ volumeId: row.volume_id, signal: controller.signal })
        if (requestId !== requestIdRef.current) return
        setEntries((prev) =>
          prev.map((entry) =>
            entry.volume_id === row.volume_id
              ? { ...entry, book: volume.ok ? volume.item : null, bookFailed: !volume.ok }
              : entry,
          ),
        )
      } catch (err) {
        if (err?.name === 'AbortError') return
        if (requestId !== requestIdRef.current) return
        setEntries((prev) =>
          prev.map((entry) =>
            entry.volume_id === row.volume_id ? { ...entry, bookFailed: true } : entry,
          ),
        )
      }
    })
  }, [userId])

  useEffect(() => {
    runFetch()
    return () => abortRef.current?.abort()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId])

  // Removing the last book should fall back to the empty state. Done as an
  // effect rather than inside a state updater, so the updater stays pure.
  useEffect(() => {
    if (phase === 'loaded' && entries.length === 0) setPhase('empty')
  }, [entries, phase])

  const changeStatus = useCallback(
    async (volumeId, status) => {
      setPendingVolumeId(volumeId)
      setActionError(null)

      const result = await apiUpdateStatus({ userId, volumeId, status })
      setPendingVolumeId(null)

      if (!result.ok) {
        setActionError({ volumeId, message: result.message })
        return
      }

      // Apply the server's value rather than the optimistic one, so the UI
      // can never show a status the database didn't actually accept.
      setEntries((prev) =>
        prev.map((entry) =>
          entry.volume_id === volumeId ? { ...entry, status: result.item.status } : entry,
        ),
      )
    },
    [userId],
  )

  const remove = useCallback(
    async (volumeId) => {
      setPendingVolumeId(volumeId)
      setActionError(null)

      const result = await apiRemove({ userId, volumeId })
      setPendingVolumeId(null)

      if (!result.ok) {
        setActionError({ volumeId, message: result.message })
        return
      }

      setEntries((prev) => prev.filter((entry) => entry.volume_id !== volumeId))
    },
    [userId],
  )

  return {
    entries,
    phase,
    error,
    pendingVolumeId,
    actionError,
    changeStatus,
    remove,
    retry: runFetch,
  }
}
