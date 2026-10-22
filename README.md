# GMLTrack

Medical device accountability: shift handovers, incident reports and an audit trail, backed by a shared Supabase database with realtime updates.

Built with React, Vite, Tailwind CSS and Supabase JS. Live at **https://bbanjoh.github.io/gmltrack/**.

## Develop

```bash
npm install
npm run dev
```

## Deploy

Every push to `main` builds the app and deploys `dist/` to GitHub Pages via `.github/workflows/deploy.yml`.
One-time setup: **Settings → Pages → Build and deployment → Source: GitHub Actions**.

The Vite `base` is `/gmltrack/` (see `vite.config.js`). The Supabase URL and anon key are in `src/lib/supabase.js`.

## Database

Uses the existing `departments`, `devices`, `nurses`, `handovers` and `incidents` tables. The anon role needs
select/insert/update/delete on them (via RLS policies), and the tables must be in the `supabase_realtime`
publication for live updates.
