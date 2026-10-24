# BookWorm — Frontend

Netflix-style book discovery app. Browse by genre, search by title, read what
other readers thought, and — once signed in — keep a private library and write
a log for each book you've read.

This repository is the **frontend only**. The backend (Postgres with Row Level
Security, Auth, and the `books` Edge Function that proxies the Google Books
API) lives in Supabase and is deployed separately.

## Stack

Vite · React · React Router · Supabase JS

## Run it locally

```bash
npm install
cp .env.example .env.local   # fill in the two values below
npm run dev                  # http://localhost:5173
```

If either variable is missing or malformed, the app stops with an on-screen
message naming what to fix instead of failing silently.

| Script | What it does |
|---|---|
| `npm run dev` | Dev server with hot reload |
| `npm run build` | Production build into `dist/` |
| `npm run preview` | Serve the built bundle locally |
| `npm run lint` | Lint with oxlint |

## Environment variables

| Variable | Where to get it |
|---|---|
| `VITE_SUPABASE_URL` | Supabase Dashboard → Project Settings → API |
| `VITE_SUPABASE_ANON_KEY` | Supabase Dashboard → Project Settings → API |

Both are public by design — the anon key is protected by Row Level Security,
not by secrecy.

**The Google Books API key is never in this repository.** It is a Supabase
Edge Function secret. Anything prefixed `VITE_` is compiled into the bundle
served to every visitor, so a key placed there is a leaked key. The browser
never calls Google Books directly; every request goes through the Edge
Function.

## Deploying to Vercel

Import this repository and keep the Vite defaults — build `npm run build`,
output `dist`. Add the two variables above for **Production, Preview and
Development**, then deploy.

Vite bakes environment variables in at **build time**, so adding or changing
one has no effect until the next build. If you add a variable after the first
deploy, redeploy.

`vercel.json` rewrites every path to `index.html` so React Router deep links
and hard refreshes work on all routes.

### Supabase settings for the deployed site

Under **Authentication → URL Configuration**, set **Site URL** and add the
deployed domain to **Redirect URLs**, keeping `http://localhost:5173` for
local development.

## How it fits together

```
Browser → Supabase Edge Function (books) → Google Books API
Browser → Supabase PostgREST / Auth      → Postgres (RLS)
```

- `src/lib/booksApi.js` is the only module that talks to the Edge Function.
- `src/lib/libraryApi.js` and `src/lib/logsApi.js` are the only modules that
  write to `library_items` and `logs`.
- Libraries are private and logs are publicly readable, enforced by database
  policies rather than by hidden UI.
