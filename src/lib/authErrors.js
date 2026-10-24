// Supabase Auth errors -> friendly copy. Same single-table pattern as
// src/lib/booksApi.js, so auth wording stays consistent instead of drifting
// between the login and signup screens.

const MESSAGES_BY_CODE = {
  invalid_credentials: 'That email or password is incorrect.',
  email_not_confirmed: 'Please confirm your email address before logging in.',
  user_already_exists: 'That email is already registered. Try logging in instead.',
  email_exists: 'That email is already registered. Try logging in instead.',
  weak_password: 'Please choose a stronger password — at least 6 characters.',
  over_request_rate_limit: 'Too many attempts. Please wait a moment and try again.',
  over_email_send_rate_limit: 'Too many emails sent just now. Please wait a moment and try again.',
  validation_failed: 'Please check the details you entered and try again.',
  signup_disabled: 'New sign-ups are currently disabled.',
}

const NETWORK_MESSAGE = 'Could not reach the server. Check your connection and try again.'
const GENERIC_MESSAGE = 'Something went wrong. Please try again.'

// supabase-js has moved toward stable `code` values, but older/edge responses
// still only carry a message string — so fall back to matching on text.
export function friendlyAuthError(error) {
  if (!error) return GENERIC_MESSAGE

  const byCode = error.code ? MESSAGES_BY_CODE[error.code] : null
  if (byCode) return byCode

  const text = String(error.message ?? '').toLowerCase()

  if (text.includes('invalid login credentials')) return MESSAGES_BY_CODE.invalid_credentials
  if (text.includes('email not confirmed')) return MESSAGES_BY_CODE.email_not_confirmed
  if (text.includes('already registered') || text.includes('already been registered')) {
    return MESSAGES_BY_CODE.user_already_exists
  }
  if (text.includes('password should be at least')) return MESSAGES_BY_CODE.weak_password
  if (text.includes('rate limit') || text.includes('too many requests')) {
    return MESSAGES_BY_CODE.over_request_rate_limit
  }
  if (text.includes('failed to fetch') || text.includes('networkerror') || text.includes('network')) {
    return NETWORK_MESSAGE
  }

  return GENERIC_MESSAGE
}
