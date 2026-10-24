// BookWorm — the SOLE place that talks to Google Books (via the Supabase
// `books` Edge Function). CLAUDE.md hard rule: no other file may reference
// googleapis.com or call the function directly.
//
// Always plain fetch + GET. supabase.functions.invoke() defaults to POST,
// which the function rejects with 405 — see supabase/functions/books/index.ts.

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

// https://<ref>.supabase.co -> https://<ref>.supabase.co/functions/v1/books
// Built with the URL constructor, not string concatenation, so a missing or
// extra trailing slash on VITE_SUPABASE_URL can't produce a malformed path.
function deriveFunctionUrl(base) {
  if (!base) return null
  try {
    return new URL('/functions/v1/books', base).toString()
  } catch {
    return null
  }
}

const FUNCTION_URL = deriveFunctionUrl(SUPABASE_URL)

// One table, used everywhere an error needs to become on-screen copy, so the
// wording stays consistent across Home/Search/Genre instead of drifting.
const FRIENDLY_MESSAGES = {
  config_error: 'The app is missing its Supabase configuration. Check your .env.local.',
  network_error: 'Could not reach the book service. Check your connection and try again.',
  bad_response: 'The book service returned an unexpected response. Please try again.',
  rate_limited: 'Google Books is getting a lot of requests right now. Please wait a moment and try again.',
  upstream_unavailable: 'The book service is temporarily unavailable. Please try again shortly.',
  upstream_timeout: 'That took too long to respond. Please try again.',
  upstream_rejected: 'The book service could not process that request. Please try again.',
  internal_error: 'Something went wrong. Please try again.',
  invalid_genre: 'That genre is not supported.',
  missing_genre: 'Choose a genre to browse.',
  missing_query: 'Enter a title to search for.',
  query_too_long: 'Search terms are too long — try something shorter.',
  invalid_start_index: 'Could not load that page of results.',
  invalid_max_results: 'Could not load that many results.',
}

export function friendlyErrorMessage(code, serverMessage) {
  return FRIENDLY_MESSAGES[code] ?? serverMessage ?? 'Something went wrong. Please try again.'
}

// Mirrors the server's own URL-building discipline: URL + searchParams.set(),
// never .append or string concatenation, so a param can never end up
// duplicated into the function's 400 duplicate_param response.
function buildUrl(params) {
  const url = new URL(FUNCTION_URL)
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null) continue
    url.searchParams.set(key, String(value))
  }
  return url
}

// Normalizes every outcome to one of two shapes so callers only ever check
// `result.ok` — never HTTP status, never re-parse JSON themselves.
//   { ok: true, raw: <parsed body> }
//   { ok: false, code, message, retryAfter }
// An aborted request rethrows (not a failure — the caller cancelled on purpose).
async function callBooksFunction(params, signal) {
  if (!FUNCTION_URL) {
    return { ok: false, code: 'config_error', message: friendlyErrorMessage('config_error'), retryAfter: null }
  }

  const url = buildUrl(params)
  let res
  try {
    res = await fetch(url, {
      method: 'GET',
      // Harmless to send; not required since the function's Verify JWT is
      // off. Kept for parity with the rest of the app's supabase-js calls.
      headers: ANON_KEY ? { apikey: ANON_KEY } : {},
      signal,
    })
  } catch (err) {
    if (err.name === 'AbortError') throw err
    return { ok: false, code: 'network_error', message: friendlyErrorMessage('network_error'), retryAfter: null }
  }

  const payload = await res.json().catch(() => null)

  if (!res.ok) {
    const code = payload?.error?.code ?? 'bad_response'
    const retryAfterHeader = res.headers.get('Retry-After')
    return {
      ok: false,
      code,
      message: friendlyErrorMessage(code, payload?.error?.message),
      retryAfter: retryAfterHeader ? Number(retryAfterHeader) : null,
    }
  }

  if (payload === null) {
    return { ok: false, code: 'bad_response', message: friendlyErrorMessage('bad_response'), retryAfter: null }
  }

  return { ok: true, raw: payload }
}

export async function searchBooks({ q, startIndex = 0, maxResults = 20, signal } = {}) {
  const result = await callBooksFunction({ action: 'search', q, startIndex, maxResults }, signal)
  if (!result.ok) return result
  return { ok: true, items: result.raw.items ?? [], page: result.raw.page, totalItems: result.raw.totalItems ?? 0 }
}

export async function browseGenre({ genre, startIndex = 0, maxResults = 20, signal } = {}) {
  const result = await callBooksFunction({ action: 'genre', genre, startIndex, maxResults }, signal)
  if (!result.ok) return result
  return { ok: true, items: result.raw.items ?? [], page: result.raw.page, totalItems: result.raw.totalItems ?? 0 }
}

// Not called in Stage 4 — BookDetails stays a placeholder until Stage 5.
// Included now so the client already matches the full function contract.
export async function getVolume({ volumeId, signal } = {}) {
  const result = await callBooksFunction({ action: 'volume', volumeId }, signal)
  if (!result.ok) return result
  return { ok: true, item: result.raw.item }
}
