import { supabase } from './supabase'

// BookWorm — all library_items access lives here, mirroring the normalized
// { ok, ... } result shape used by src/lib/booksApi.js so callers never have
// to inspect a raw PostgREST error.
//
// Every query below is additionally protected by Stage 2's RLS: library_items
// policies are owner-only for authenticated and grant anon nothing at all.
// The explicit .eq('user_id', ...) filters are belt-and-braces, not the
// security boundary — the database is.

// Exactly the three values the library_items CHECK constraint allows. The
// spaces are intentional: these are the literal stored values.
export const READING_STATUSES = ['want to read', 'reading', 'finished']

export const STATUS_LABELS = {
  'want to read': 'Want to read',
  reading: 'Reading',
  finished: 'Finished',
}

const MESSAGES = {
  duplicate: 'That book is already in your library.',
  not_signed_in: 'Please log in to manage your library.',
  denied: 'You can only change your own library.',
  bad_status: 'That reading status is not allowed.',
  network: 'Could not reach the server. Check your connection and try again.',
  generic: 'Something went wrong. Please try again.',
}

function friendlyError(error) {
  if (!error) return MESSAGES.generic

  switch (error.code) {
    case '23505': // unique_violation on (user_id, volume_id)
      return MESSAGES.duplicate
    case '23514': // check_violation on status
      return MESSAGES.bad_status
    case '42501': // insufficient_privilege
      return MESSAGES.denied
    default:
      break
  }

  const text = String(error.message ?? '').toLowerCase()
  if (text.includes('jwt') || text.includes('not authenticated')) return MESSAGES.not_signed_in
  if (text.includes('failed to fetch') || text.includes('network')) return MESSAGES.network
  return MESSAGES.generic
}

const ROW_COLUMNS = 'id, volume_id, status, created_at'

export async function listLibrary({ userId, signal } = {}) {
  if (!userId) return { ok: false, message: MESSAGES.not_signed_in }

  try {
    const { data, error } = await supabase
      .from('library_items')
      .select(ROW_COLUMNS)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .abortSignal(signal)

    if (error) return { ok: false, message: friendlyError(error) }
    return { ok: true, items: data ?? [] }
  } catch (err) {
    if (err?.name === 'AbortError') throw err
    return { ok: false, message: friendlyError(err) }
  }
}

export async function getLibraryEntry({ userId, volumeId, signal } = {}) {
  if (!userId) return { ok: false, message: MESSAGES.not_signed_in }

  try {
    const { data, error } = await supabase
      .from('library_items')
      .select(ROW_COLUMNS)
      .eq('user_id', userId)
      .eq('volume_id', volumeId)
      .maybeSingle()
      .abortSignal(signal)

    if (error) return { ok: false, message: friendlyError(error) }
    return { ok: true, item: data ?? null }
  } catch (err) {
    if (err?.name === 'AbortError') throw err
    return { ok: false, message: friendlyError(err) }
  }
}

// `status` is deliberately omitted — the column's DB default ('want to read')
// owns that choice, so the default lives in exactly one place.
export async function addToLibrary({ userId, volumeId } = {}) {
  if (!userId) return { ok: false, message: MESSAGES.not_signed_in }

  try {
    const { data, error } = await supabase
      .from('library_items')
      .insert({ user_id: userId, volume_id: volumeId })
      .select(ROW_COLUMNS)
      .single()

    if (error) return { ok: false, code: error.code, message: friendlyError(error) }
    return { ok: true, item: data }
  } catch (err) {
    return { ok: false, message: friendlyError(err) }
  }
}

// Sends ONLY { status }. `authenticated` holds a COLUMN-SCOPED update grant:
//   grant update (status) on public.library_items to authenticated;
// Including any other column — even created_at — makes Postgres reject the
// whole statement with 42501. That constraint is a feature: it makes it
// structurally impossible for a client to re-point a row at another user.
export async function updateStatus({ userId, volumeId, status } = {}) {
  if (!userId) return { ok: false, message: MESSAGES.not_signed_in }
  if (!READING_STATUSES.includes(status)) {
    return { ok: false, message: MESSAGES.bad_status }
  }

  try {
    const { data, error } = await supabase
      .from('library_items')
      .update({ status })
      .eq('user_id', userId)
      .eq('volume_id', volumeId)
      .select(ROW_COLUMNS)
      .single()

    if (error) return { ok: false, message: friendlyError(error) }
    return { ok: true, item: data }
  } catch (err) {
    return { ok: false, message: friendlyError(err) }
  }
}

// Removing a library row cascades to that user's logs for the same volume
// (logs_library_fkey ... on delete cascade), which is why callers confirm
// first. That cascade is the README's stated behaviour, enforced in the DB.
export async function removeFromLibrary({ userId, volumeId } = {}) {
  if (!userId) return { ok: false, message: MESSAGES.not_signed_in }

  try {
    const { error } = await supabase
      .from('library_items')
      .delete()
      .eq('user_id', userId)
      .eq('volume_id', volumeId)

    if (error) return { ok: false, message: friendlyError(error) }
    return { ok: true }
  } catch (err) {
    return { ok: false, message: friendlyError(err) }
  }
}
