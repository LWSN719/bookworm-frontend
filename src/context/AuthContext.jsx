import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'
import { friendlyAuthError } from '../lib/authErrors'

const AuthContext = createContext(null)

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (ctx === null) {
    throw new Error('useAuth must be used inside <AuthProvider>')
  }
  return ctx
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)
  // True until the first getSession() resolves. supabase-js restores the
  // session from storage asynchronously, so anything that branches on
  // "signed in?" must wait this out — otherwise a refresh would flash the
  // signed-out view at someone who is actually logged in.
  const [initializing, setInitializing] = useState(true)

  useEffect(() => {
    let active = true

    supabase.auth
      .getSession()
      .then(({ data }) => {
        if (!active) return
        setSession(data.session ?? null)
      })
      .catch(() => {
        if (!active) return
        setSession(null)
      })
      .finally(() => {
        if (!active) return
        setInitializing(false)
      })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession ?? null)
    })

    return () => {
      active = false
      subscription.unsubscribe()
    }
  }, [])

  const userId = session?.user?.id ?? null

  // The display name lives in the profiles table — created automatically by
  // the Stage 2 signup trigger, and the source of truth the README names.
  // Reading it needs no special privilege: profiles_select_public allows it.
  useEffect(() => {
    if (!userId) {
      setProfile(null)
      return
    }

    let active = true

    ;(async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('id, display_name, created_at')
          .eq('id', userId)
          .maybeSingle()

        if (!active) return
        setProfile(error ? null : (data ?? null))
      } catch {
        if (!active) return
        setProfile(null)
      }
    })()

    return () => {
      active = false
    }
  }, [userId])

  // Applies a profile row the caller already has — the one returned by a
  // successful display-name update. Everything that shows a name reads it
  // from here, so the navbar, greeting and avatar change immediately; logs
  // follow on their next fetch, since they read the name through the
  // profiles join rather than storing a copy.
  const applyProfile = useCallback((row) => {
    if (row?.id) setProfile(row)
  }, [])

  const signIn = useCallback(async ({ email, password }) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) return { ok: false, message: friendlyAuthError(error) }
    return { ok: true }
  }, [])

  const signUp = useCallback(async ({ email, password, displayName }) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      // The Stage 2 trigger reads raw_user_meta_data ->> 'display_name' and
      // creates the profiles row itself, so the client never inserts one.
      options: { data: { display_name: displayName } },
    })

    if (error) return { ok: false, message: friendlyAuthError(error) }

    // Supabase's email-enumeration protection returns a *successful* response
    // with an empty identities array when the address is already registered.
    // Surfacing that plainly is the clearer experience here, at the cost of
    // confirming an address exists — a deliberate trade-off for this app.
    if (data.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
      return { ok: false, message: friendlyAuthError({ code: 'user_already_exists' }) }
    }

    // No session means the project requires email confirmation first.
    return { ok: true, needsEmailConfirmation: !data.session }
  }, [])

  // Re-verifies the current password before changing it. Supabase does not
  // require this — updateUser would accept a new password on the strength of
  // the existing session alone — but without it anyone at an unlocked
  // machine could take the account over. The re-check is a normal sign-in
  // for the same user, so a wrong guess fails without disturbing the session
  // they already have.
  const changePassword = useCallback(
    async ({ currentPassword, newPassword }) => {
      const email = session?.user?.email
      if (!email) return { ok: false, message: 'Please log in again to change your password.' }

      const { error: reauthError } = await supabase.auth.signInWithPassword({
        email,
        password: currentPassword,
      })
      if (reauthError) return { ok: false, message: 'That current password is incorrect.' }

      const { error } = await supabase.auth.updateUser({ password: newPassword })
      if (error) return { ok: false, message: friendlyAuthError(error) }
      return { ok: true }
    },
    [session],
  )

  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut()
    if (error) return { ok: false, message: friendlyAuthError(error) }
    return { ok: true }
  }, [])

  const value = useMemo(
    () => ({
      session,
      user: session?.user ?? null,
      profile,
      displayName: profile?.display_name ?? null,
      isSignedIn: session !== null,
      initializing,
      signIn,
      signUp,
      signOut,
      applyProfile,
      changePassword,
    }),
    [session, profile, initializing, signIn, signUp, signOut, applyProfile, changePassword],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
