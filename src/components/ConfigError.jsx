import './ConfigError.css'

// Shown instead of the app when required public configuration is missing.
//
// Deliberately a full-page stop rather than a dismissible banner: without
// this config nothing works — no books, no auth, no library — so letting the
// app render would only produce a wall of identical failures that say
// nothing about the cause.
//
// Lists variable NAMES only. Values never appear here; this renders in the
// browser, where anything printed is public.
export default function ConfigError({ missing }) {
  return (
    <main className="config-error">
      <div className="config-error-card" role="alert">
        <h1 className="config-error-title">BookWorm is not configured</h1>
        <p>
          The app can't start because required environment variables are missing or
          unusable:
        </p>
        <ul className="config-error-list">
          {missing.map((name) => (
            <li key={name}>
              <code>{name}</code>
            </li>
          ))}
        </ul>

        <h2 className="config-error-subtitle">Running locally</h2>
        <p>
          Copy <code>.env.example</code> to <code>.env.local</code>, fill in the two values
          from your Supabase project (Settings → API), then restart the dev server. Vite only
          reads env files at startup.
        </p>

        <h2 className="config-error-subtitle">Deployed on Vercel</h2>
        <p>
          Set them under Project → Settings → Environment Variables for the environment you
          are deploying, then <strong>redeploy</strong>. Values are baked into the bundle at
          build time, so changing a variable has no effect until the next build.
        </p>

        <p className="config-error-warning">
          These two variables are public by design. Never add the Google Books key here or to
          any <code>VITE_</code> variable — anything so prefixed is compiled into the browser
          bundle. It belongs only in the Supabase Edge Function secret.
        </p>
      </div>
    </main>
  )
}
