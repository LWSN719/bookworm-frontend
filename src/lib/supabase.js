import { createClient } from '@supabase/supabase-js'

// Public, browser-safe config only. The anon key is meant to be exposed; it
// relies on Row Level Security (added in Stage 2) to keep data safe.
// Never put the Google Books key here or in any VITE_ variable — see CLAUDE.md.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Which required variables are missing or unusable, by NAME only — never a
// value, since this is rendered in the browser.
//
// This used to be a console.warn, on the reasoning that early pages didn't
// call Supabase yet. That stopped being true: every page now needs this
// config, and on a hosted deploy a silent warning means a site that builds
// and ships cleanly, then fails at runtime with nothing on screen to say
// why. A misconfigured deployment should be obvious, not invisible.
function computeMissing() {
  const missing = []

  if (!supabaseUrl) {
    missing.push('VITE_SUPABASE_URL')
  } else {
    // Set but malformed is its own silent-failure mode: the client builds,
    // then every request fails for no stated reason.
    try {
      new URL(supabaseUrl)
    } catch {
      missing.push('VITE_SUPABASE_URL (set, but not a valid URL)')
    }
  }

  if (!supabaseAnonKey) missing.push('VITE_SUPABASE_ANON_KEY')

  return missing
}

const envProblems = computeMissing()

export function missingSupabaseEnv() {
  return envProblems
}

// createClient() THROWS on an empty or malformed URL ("supabaseUrl is
// required"). At module scope that kills the import before anything can be
// rendered, so a misconfigured deploy shows a blank page — exactly the
// silent failure this file is meant to prevent. Verified in a headless
// browser: without the guard below, #root stays empty.
//
// So when the config is unusable we export a stub instead. Imports keep
// working, main.jsx gets to render the config screen, and any actual call
// fails loudly with the reason rather than quietly.
function createSupabaseClient() {
  if (envProblems.length > 0) {
    const fail = () => {
      throw new Error(`Supabase is not configured (${envProblems.join(', ')})`)
    }
    return new Proxy({}, { get: fail, apply: fail })
  }
  return createClient(supabaseUrl, supabaseAnonKey)
}

export const supabase = createSupabaseClient()
