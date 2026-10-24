import { useCallback, useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'

// Public reader logs for a book — world-readable per Stage 2 RLS
// (logs_select_public grants SELECT to anon, authenticated), so this needs
// no auth context. Explicit `!logs_author_fkey` hint, not implicit
// relationship inference: `logs` has two foreign keys (one to profiles for
// the author, one composite to library_items for the library-membership
// rule), so letting PostgREST guess which one to embed through is fragile.
//
// `user_id` is selected so the page can tell which log belongs to the
// viewer. That exposes nothing new: anon already holds a table-wide SELECT
// grant on logs and the policy is USING (true), so anyone could query the
// column directly. Ownership here drives which buttons render — never
// whether a write is allowed, which is the database's call.
export function useBookLogs({ volumeId }) {
  const [logs, setLogs] = useState([])
  // Internally only: loading | loaded | error. 'empty' is derived at the
  // boundary from the list itself, so local edits can't leave the phase
  // disagreeing with what's actually on screen.
  const [phase, setPhase] = useState('loading')
  const [error, setError] = useState(null)

  const abortRef = useRef(null)
  const requestIdRef = useRef(0)

  const runFetch = useCallback(async () => {
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller
    const requestId = ++requestIdRef.current

    setPhase('loading')
    setError(null)

    try {
      const { data, error: queryError } = await supabase
        .from('logs')
        .select('id, user_id, body, rating, created_at, profiles!logs_author_fkey(display_name)')
        .eq('volume_id', volumeId)
        .order('created_at', { ascending: false })
        .abortSignal(controller.signal)

      if (requestId !== requestIdRef.current) return // superseded by a newer request

      if (queryError) {
        setPhase('error')
        setError({ message: 'Could not load reader logs. Please try again.' })
        return
      }

      setLogs(data ?? [])
      setPhase('loaded')
    } catch (err) {
      if (err?.name === 'AbortError') return // cancelled on purpose, not a failure
      if (requestId !== requestIdRef.current) return
      setPhase('error')
      setError({ message: 'Could not load reader logs. Please try again.' })
    }
  }, [volumeId])

  useEffect(() => {
    runFetch()
    return () => abortRef.current?.abort()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [volumeId])

  // Patch a written row into the list instead of refetching. A refetch would
  // blank the whole public list back to "Loading reader logs…" every time
  // the viewer saves an edit. The write already returns the full row,
  // embedded display name included, so there is nothing to go and ask for.
  const upsert = useCallback(
    (row) => {
      if (!row?.id) {
        runFetch() // unexpected shape — fall back to the authoritative list
        return
      }
      setLogs((current) =>
        current.some((log) => log.id === row.id)
          ? current.map((log) => (log.id === row.id ? row : log))
          : [row, ...current], // newest first, matching the server's ordering
      )
      setPhase('loaded')
    },
    [runFetch],
  )

  const drop = useCallback((id) => {
    setLogs((current) => current.filter((log) => log.id !== id))
    setPhase('loaded')
  }, [])

  return {
    logs,
    phase: phase === 'loaded' && logs.length === 0 ? 'empty' : phase,
    // True only once the list genuinely loaded. Callers must not infer
    // "this user hasn't written a log" from an empty array that was never
    // populated because the request failed.
    isSettled: phase === 'loaded',
    error,
    retry: runFetch,
    upsert,
    drop,
  }
}
