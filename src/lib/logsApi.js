import { supabase } from './supabase'

// BookWorm — every write to `logs` goes through this module, mirroring the
// normalized { ok, ... } shape used by booksApi.js and libraryApi.js so
// callers never inspect a raw PostgREST error.
//
// Reads are deliberately NOT here: logs are world-readable, and the public
// list lives in src/hooks/useBookLogs.js. This file is the write side only.
//
// The real authorization is in the database, not below:
//   logs_insert_own / logs_update_own / logs_delete_own  -> auth.uid() = user_id
//   logs_library_fkey (user_id, volume_id) -> library_items  (composite FK)
// The .eq('user_id', ...) filters here are belt-and-braces. A user who got
// past them would still be stopped by RLS.

// Mirrors the CHECK constraints exactly, so the common mistakes fail fast
// without a round trip. The database remains the authority.
export const LOG_BODY_MAX = 4000
export const RATING_MIN = 1
export const RATING_MAX = 5

const MESSAGES = {
  not_signed_in: 'Please log in to manage your log.',
  not_in_library: 'Add this book to your library before writing a log.',
  duplicate: 'You already have a log for this book. Edit that one instead.',
  not_yours: 'You can only edit or delete your own log.',
  missing_body: 'Please write something before saving.',
  too_long: `Logs are limited to ${LOG_BODY_MAX} characters.`,
  bad_rating: `A rating must be a whole number from ${RATING_MIN} to ${RATING_MAX}.`,
  gone: 'That log no longer exists. Refreshing the list.',
  network: 'Could not reach the server. Check your connection and try again.',
  generic: 'Something went wrong. Please try again.',
}

function friendlyError(error) {
  if (!error) return MESSAGES.generic

  switch (error.code) {
    // logs_user_volume_key: one log per user per book, enforced in the
    // database. Reachable legitimately — two tabs open, or a log written on
    // another device since this page loaded.
    case '23505':
      return MESSAGES.duplicate
    // The composite foreign key: no matching library_items row for this
    // (user_id, volume_id). Reachable legitimately — remove the book in one
    // tab, then save a log in another — so it gets a real message.
    case '23503':
      return MESSAGES.not_in_library
    case '23514': // body length or rating range
      return MESSAGES.bad_rating
    case '42501': // insufficient_privilege (e.g. a column outside the grant)
      return MESSAGES.not_yours
    // .single() matched no row. Either the log is gone, or RLS filtered out
    // somebody else's row — which is exactly what should happen.
    case 'PGRST116':
      return MESSAGES.not_yours
    default:
      break
  }

  const text = String(error.message ?? '').toLowerCase()
  if (text.includes('jwt') || text.includes('not authenticated')) return MESSAGES.not_signed_in
  if (text.includes('failed to fetch') || text.includes('network')) return MESSAGES.network
  return MESSAGES.generic
}

// Same columns the public list selects, so a written row can be patched
// straight into it without a refetch. The embedded profile uses the explicit
// !logs_author_fkey hint because `logs` has two foreign keys and letting
// PostgREST guess between them is fragile.
const ROW_COLUMNS = 'id, user_id, volume_id, body, rating, created_at, profiles!logs_author_fkey(display_name)'

// Returns { body, rating } ready to send, or { message } if it can't be.
// `rating` normalizes to null — the column is nullable, which is what makes
// the rating optional.
function normalize({ body, rating }) {
  const trimmedBody = String(body ?? '').trim()
  if (trimmedBody.length < 1) return { message: MESSAGES.missing_body }
  if (trimmedBody.length > LOG_BODY_MAX) return { message: MESSAGES.too_long }

  if (rating === null || rating === undefined || rating === '') {
    return { body: trimmedBody, rating: null }
  }

  const numericRating = Number(rating)
  if (!Number.isInteger(numericRating) || numericRating < RATING_MIN || numericRating > RATING_MAX) {
    return { message: MESSAGES.bad_rating }
  }

  return { body: trimmedBody, rating: numericRating }
}

export async function createLog({ userId, volumeId, body, rating } = {}) {
  if (!userId) return { ok: false, message: MESSAGES.not_signed_in }

  const values = normalize({ body, rating })
  if (values.message) return { ok: false, message: values.message }

  try {
    const { data, error } = await supabase
      .from('logs')
      .insert({ user_id: userId, volume_id: volumeId, body: values.body, rating: values.rating })
      .select(ROW_COLUMNS)
      .single()

    if (error) return { ok: false, code: error.code, message: friendlyError(error) }
    return { ok: true, item: data }
  } catch (err) {
    return { ok: false, message: friendlyError(err) }
  }
}

// Sends ONLY { body, rating }. `authenticated` holds a COLUMN-SCOPED update
// grant on this table:
//   grant update (body, rating) on public.logs to authenticated;
// Including any other column — user_id, volume_id, even created_at — makes
// Postgres reject the whole statement with 42501. That is a feature: it is
// structurally impossible for a client to re-point a log at another user or
// another book.
export async function updateLog({ logId, userId, body, rating } = {}) {
  if (!userId) return { ok: false, message: MESSAGES.not_signed_in }

  const values = normalize({ body, rating })
  if (values.message) return { ok: false, message: values.message }

  try {
    const { data, error } = await supabase
      .from('logs')
      .update({ body: values.body, rating: values.rating })
      .eq('id', logId)
      .eq('user_id', userId)
      .select(ROW_COLUMNS)
      .single()

    if (error) return { ok: false, code: error.code, message: friendlyError(error) }
    return { ok: true, item: data }
  } catch (err) {
    return { ok: false, message: friendlyError(err) }
  }
}

// Asks for the deleted id back rather than trusting a silent success: RLS
// filters another user's row out of the statement instead of raising, so a
// forbidden delete returns zero rows, not an error. Zero rows is therefore
// treated as a failure, not as "done".
export async function deleteLog({ logId, userId } = {}) {
  if (!userId) return { ok: false, message: MESSAGES.not_signed_in }

  try {
    const { data, error } = await supabase
      .from('logs')
      .delete()
      .eq('id', logId)
      .eq('user_id', userId)
      .select('id')

    if (error) return { ok: false, code: error.code, message: friendlyError(error) }
    if (!data || data.length === 0) return { ok: false, message: MESSAGES.not_yours }
    return { ok: true, id: logId }
  } catch (err) {
    return { ok: false, message: friendlyError(err) }
  }
}
