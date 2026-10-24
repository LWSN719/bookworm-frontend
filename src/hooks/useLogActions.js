import { useCallback, useState } from 'react'
import { createLog, deleteLog, updateLog } from '../lib/logsApi'

// Create / edit / delete for the signed-in user's own log, with one pending
// slot and one error slot at a time — only ever one log per book per user,
// so there is never a second concurrent write to track.
//
// `scope` tags which form an error belongs to: 'create' for the composer,
// or the log's id for an inline edit or delete. Without it, a failed delete
// would print its message under the composer instead of under the log.
export function useLogActions({ userId, volumeId, onSaved, onRemoved, onConflict } = {}) {
  const [pendingScope, setPendingScope] = useState(null)
  const [error, setError] = useState(null) // { scope, message } | null

  const clearError = useCallback(() => setError(null), [])

  const create = useCallback(
    async ({ body, rating }) => {
      setPendingScope('create')
      setError(null)

      const result = await createLog({ userId, volumeId, body, rating })
      setPendingScope(null)

      if (!result.ok) {
        setError({ scope: 'create', message: result.message })
        // A duplicate means this page's view is stale: a log already exists
        // that we never loaded. Resync rather than leaving the composer
        // insisting there is none.
        if (result.code === '23505') onConflict?.()
        return { ok: false }
      }

      onSaved?.(result.item)
      return { ok: true }
    },
    [userId, volumeId, onSaved, onConflict],
  )

  const update = useCallback(
    async (logId, { body, rating }) => {
      setPendingScope(logId)
      setError(null)

      const result = await updateLog({ logId, userId, body, rating })
      setPendingScope(null)

      if (!result.ok) {
        setError({ scope: logId, message: result.message })
        return { ok: false }
      }

      onSaved?.(result.item)
      return { ok: true }
    },
    [userId, onSaved],
  )

  const remove = useCallback(
    async (logId) => {
      setPendingScope(logId)
      setError(null)

      const result = await deleteLog({ logId, userId })
      setPendingScope(null)

      if (!result.ok) {
        setError({ scope: logId, message: result.message })
        return { ok: false }
      }

      onRemoved?.(logId)
      return { ok: true }
    },
    [userId, onRemoved],
  )

  return { create, update, remove, pendingScope, error, clearError }
}
