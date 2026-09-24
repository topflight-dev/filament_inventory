# 🏺 Crafted 3D Workshop — Filament Inventory & Print Queue

Full-stack site for a family-run 3D printing business: a public marketing site, a live filament inventory display, a print-request intake form, and an admin queue/inventory dashboard — all one Next.js app talking directly to Supabase.

**Live site:** [crafted3dworkshop.com](https://crafted3dworkshop.com)

---

## Architecture

This repo has one deployable app: **`web/`** — a Next.js 16 (App Router) + React 19 + TypeScript + Tailwind 4 app, deployed by Vercel (Root Directory = `web`) on every push to `main`. There is no separate backend API — the app talks to Supabase directly from both the browser and Route Handlers via `@supabase/ssr`, protected by Row Level Security.

`main` is the only branch. Everything at the repo root outside `web/` is either config (`.clinerules`, `vercel.json`, `CNAME`) or historical reference — not part of the live app.

### Routes

- `web/src/app/(marketing)/` — public pages: home, inventory (`/inventory`), gallery, contact, team, and the print-request intake form (`/request`)
- `web/src/app/(dashboard)/hub/` — the admin dashboard: incoming request queue, inventory management (add/edit/delete filaments, toggle stock)
- `web/src/app/api/` — `keepalive` (Vercel Cron target, keeps Supabase warm) and `notify-discord` (fires a Discord webhook notification on new print requests)

### Data layer

- `web/src/lib/supabase/client.ts` / `server.ts` — Supabase client setup (browser and server)
- `web/src/lib/supabase/queries.ts` / `hub-queries.ts` — data access for the public site and the Hub dashboard, respectively
- `web/src/components/hub/` — `HubShell`, `QueueTable`, `InventoryManager`, `InvEditModal`, `AuthGate`

---

## Database (Supabase)

Row Level Security is enabled on every table. Schema changes require explicit approval — see `.clinerules`.

- **`colors`** — filament inventory (color, finish, stock status)
- **`print_jobs`** — the print request queue submitted via `/request`
- **`shops`** — multi-tenant shop/branding config
- **`site_traffic`** — visit analytics, written by `TrackerBeacon`

---

## Local Development

```bash
cd web
npm install
npm run dev
```

You'll need a `web/.env.local` with your own Supabase project URL/anon key and any admin/webhook secrets. Never commit `.env.local`.

## Deployment

Production deploys happen only through `git push origin main` — Vercel's Git integration builds and deploys automatically. Never run `vercel --prod` manually (see `.clinerules`).

---

## Repo History

This project was previously a plain HTML/CSS/JS site with a separate Express.js API hosted on Render, plus a native Electron desktop admin app. Both were fully retired and removed as of the 2026-09-23 cleanup (see `Project_Log.md` and `.clinerules`'s Cleanup Roadmap for the commit-by-commit history). The `web/` Next.js app has been the only live implementation since then.
