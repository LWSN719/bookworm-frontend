import { supabase } from './supabase'

// BookWorm — the only place that writes to `profiles`, mirroring the
// { ok, ... } shape used by booksApi/libraryApi/logsApi.
//
// Authorization is the database's, not this file's: profiles_update_own
// matches (select auth.uid()) = id on both USING and WITH CHECK, so the
// .eq('id', userId) below is belt-and-braces.

// profiles_display_name_check, restated:
//   char_length between 1 and 50 AND display_name = btrim(display_name)
// The equality half matters — a value with surrounding whitespace is
// rejected outright, so the trim here is required, not cosmetic.
export const DISPLAY_NAME_MAX = 50

const MESSAGES = {
  not_signed_in: 'Please log in again to update your profile.',
  empty: 'Please enter a display name.',
  too_long: `Display names are limited to ${DISPLAY_NAME_MAX} characters.`,
  rejected: `Display names must be 1–${DISPLAY_NAME_MAX} characters.`,
  denied: 'You can only change your own profile.',
  network: 'Could not reach the server. Check your connection and try again.',
  generic: 'Something went wrong. Please try again.',
}

function friendlyError(error) {
  if (!error) return MESSAGES.generic

  switch (error.code) {
    case '23514': // profiles_display_name_check
      return MESSAGES.rejected
    case '42501': // insufficient_privilege — e.g. a column outside the grant
      return MESSAGES.denied
    case 'PGRST116': // matched no row; RLS filtered it, or it is gone
      return MESSAGES.denied
    default:
      break
  }

  const text = String(error.message ?? '').toLowerCase()
  if (text.includes('jwt') || text.includes('not authenticated')) return MESSAGES.not_signed_in
  if (text.includes('failed to fetch') || text.includes('network')) return MESSAGES.network
  return MESSAGES.generic
}

// Sends ONLY { display_name }. `authenticated` holds a COLUMN-SCOPED update
// grant on this table:
//   grant update (display_name) on public.profiles to authenticated;
// Including any other column — id, created_at — makes Postgres reject the
// whole statement with 42501. That constraint is the point: a client cannot
// re-point a profile at another auth user.
//
// Changing this one value renames the author on every existing reading log,
// with no log row touched: `logs` stores only user_id, and the public log
// query reads the name through profiles!logs_author_fkey.
export async function updateDisplayName({ userId, displayName } = {}) {
  if (!userId) return { ok: false, message: MESSAGES.not_signed_in }

  const trimmed = String(displayName ?? '').trim()
  if (trimmed.length === 0) return { ok: false, message: MESSAGES.empty }
  if (trimmed.length > DISPLAY_NAME_MAX) return { ok: false, message: MESSAGES.too_long }

  try {
    const { data, error } = await supabase
      .from('profiles')
      .update({ display_name: trimmed })
      .eq('id', userId)
      .select('id, display_name, created_at')
      .single()

    if (error) return { ok: false, code: error.code, message: friendlyError(error) }
    return { ok: true, profile: data }
  } catch (err) {
    return { ok: false, message: friendlyError(err) }
  }
}
