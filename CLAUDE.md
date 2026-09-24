# CLAUDE.md — Source of Truth
> Crafted 3D Workshop | crafted3dworkshop.com
> Last audited: 2026-09-24

## Current Project Structure

This repo contains one live application: the Next.js app in `web/`. Everything else at the repo root is either historical reference or repo-level config — there is no other deployable site here anymore.

```
filament_inventory_site/                 ← repo root
│
├── web/                                  ← THE LIVE APP — Next.js 16, deployed by Vercel
│   └── src/
│       ├── app/
│       │   ├── (marketing)/              ← public pages: home, inventory, gallery, contact, team, request
│       │   ├── (dashboard)/hub/          ← admin queue/inventory dashboard
│       │   └── api/                      ← keepalive, notify-discord route handlers
│       ├── components/
│       │   ├── hub/                      ← AuthGate, HubShell, InventoryManager, QueueTable, InvEditModal
│       │   ├── layout/                   ← Header, Footer
│       │   └── analytics/                ← TrackerBeacon
│       ├── lib/supabase/                 ← client.ts, server.ts, queries.ts, hub-queries.ts
│       └── hooks/                        ← useHubToast
│
├── .clinerules                           ← Cline's operating rules — architecture, secrets policy, sacred DB constraints
├── Project_Log.md                        ← development log, newest entry at top
├── README.md                             ← project overview (this repo)
├── CLAUDE.md                             ← this file
├── .env                                  ← unused leftover from the retired server.js/Render backend; not read by anything live
├── CNAME                                 ← custom domain config: crafted3dworkshop.com
├── vercel.json                           ← Vercel config (Root Directory = web)
└── Admin Hub.png, Filament Inventory Insert.png, Inventory Management.png, Request Form.png
    ← historical screenshots, no functional role
```

**Retired and removed from this repo** (see the Cleanup Roadmap in `.clinerules` for the commit history): the root-level static HTML site, the Electron desktop admin app (`main.cjs`, `mobile-companion/`), the standalone Express/Render API (`server.js`), and the `feature/universal-web-target` branch. None of these exist anymore — don't recreate them or reference them as current.

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| UI | React 19, Tailwind 4 |
| Language | TypeScript |
| Database | Supabase (PostgreSQL), accessed directly via `@supabase/ssr` — no custom backend API |
| Hosting | Vercel — Root Directory = `web`, deploys on every push to `main` |
| Domain | crafted3dworkshop.com (CNAME) |
| Contact form | Web3Forms |
| Notifications | Discord webhook (`/api/notify-discord`) |
| Keep-warm | Vercel Cron → `/api/keepalive`, every 4h |

### Supabase Tables (sacred — see `.clinerules` before changing anything)
`colors`, `print_jobs`, `shops`, `site_traffic`

## Where to Look for More

- **Operating rules, secrets policy, deployment rules:** `.clinerules`
- **Full architecture audit, security findings, and the cleanup roadmap's history:** `website-architecture-audit.md` in the "3D Printing Business" Claude project
- **Recent change history:** `Project_Log.md` (newest entry at top)

*Update this file when the architecture actually changes — not as a running task log. Task-by-task history belongs in `Project_Log.md`.*
