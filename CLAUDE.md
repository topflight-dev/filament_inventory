# CLAUDE.md — Source of Truth
> Crafted 3D Workshop | crafted3dworkshop.com
> Last audited: 2026-11-15

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
│       │   └── api/                      ← route handlers: hub/* (login, session, shop-scoped queue/colors), print-request, notify-request, request-access, public/colors, keepalive
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
├── CNAME                                 ← custom domain config: crafted3dworkshop.com
├── vercel.json                           ← Vercel config (Root Directory = web)
└── Admin Hub.png, Filament Inventory Insert.png, Inventory Management.png, Request Form.png
    ← historical screenshots, no functional role
```

**Retired and removed from this repo** (see the Cleanup Roadmap in `.clinerules` for the commit history): the root-level static HTML site, the Electron desktop admin app (`main.cjs`, `mobile-companion/`), the standalone Express/Render API (`server.js`), and the `feature/universal-web-target` branch. None of these exist anymore — don't recreate them or reference them as current.

## Rules

- **Database:** No schema changes, new tables, or raw DDL without my explicit approval in the current session.
- **Writes:** Every UPDATE or DELETE must be filtered to specific rows (by `id`, plus `shop_slug` where the table has one). Never an unfiltered bulk write.
- **Secrets:** No hardcoded keys, tokens, or passwords anywhere. Client code uses only `NEXT_PUBLIC_*` values; everything else is read with `process.env` in server code.
- **Tenant boundary:** Authenticated (Hub) routes get `shop_slug` only from the signed session cookie, never from the request body or URL. Public routes that accept a shop slug (`print-request`, `notify-request`, `public/colors`) treat it as untrusted: confirm the shop exists and return or act on only that shop's public data. The service-role key and `lib/supabase/service.ts` are never used in or exposed to browser code. Every new route must follow this.
- **Deploys and git:** Never run `vercel --prod` or `vercel deploy --prod`. Never commit or push. I do commits and pushes myself.
- **Shell:** PowerShell only.
- **Done means verified:** Run `npx tsc --noEmit` and `npm run build` in `web/`, and report the results, before saying something is done.
- **Stop and ask:** If a request seems to need a database, security-policy (RLS or grants), or auth change, stop and ask before doing anything.

### Database security notes (`shops`)
- RLS is enabled, but a policy lets `anon` SELECT every row. Sensitive columns are protected **only** by column-level grants: `anon` must not be able to read `passcode`, `passcode_hash`, `notification_email`, or `discord_webhook_url` (confirmed 2026-11-15). Browser code currently uses `shop_slug`, `shop_name`, and `logo_url` (`web/src/app/(marketing)/request/page.tsx`).
- Never run GRANT or REVOKE, and never suggest a broad grant on `shops`. A new column on `shops` must not be readable by `anon` without my explicit approval. `passcode_hash`, `notification_email`, and `discord_webhook_url` must never be readable by `anon`.
- Never `select *` (or an empty `.select()`) on `shops` in browser code or in any route that returns data to a caller. Select only the columns needed.
- The plaintext `passcode` column is legacy and pending cleanup. Never read, log, return, or write it, and don't call `validateShopCredentials` (`web/src/lib/supabase/hub-queries.ts`) or run `web/scripts/migrate-passcode-hash.mjs`, which both read it.

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| UI | React 19, Tailwind 4 |
| Language | TypeScript |
| Database | Supabase (PostgreSQL). Almost all data access goes through Next.js Route Handlers in `web/src/app/api/` using the service-role client, which bypasses RLS, so the security boundary is the signed session cookie plus a `shop_slug` filter on every query. The browser anon client is used only for shop branding lookups, `site_traffic` inserts, and the Hub's realtime listener. |
| Hosting | Vercel — Root Directory = `web`, deploys on every push to `main` |
| Domain | crafted3dworkshop.com (CNAME) |
| Contact form | Web3Forms |
| Notifications | Per-shop email (Resend) and Discord webhook via `/api/notify-request`; Printcue access requests via `/api/request-access` |
| Keep-warm | Vercel Cron → `/api/keepalive`, daily at 00:00 UTC (set in `web/vercel.json`) |

### Supabase Tables (sacred — see Rules above)
`colors`, `invites`, `print_jobs`, `shops`, `site_traffic`

## Where to Look for More

- **Operating rules, secrets policy, deployment rules:** the Rules section above. (`.clinerules` holds Cline's rules.)
- **Full architecture audit, security findings, and the cleanup roadmap's history:** `website-architecture-audit.md` in the "3D Printing Business" Claude project
- **Recent change history:** `Project_Log.md` (newest entry at top)

*Update this file when the architecture actually changes — not as a running task log. Task-by-task history belongs in `Project_Log.md`.*
