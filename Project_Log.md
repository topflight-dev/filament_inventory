# C3DW Workshop — Project Log

## Latest Entry — 2026-07-12 (Phase 1 Investigation — Next.js/Tailwind/Supabase Monorepo Transition)

### Task: Investigation, Context-Building & Constraints-Mapping for Full-Stack Monorepo Refactor

**Branch:** `feature/universal-web-target`
**Files Modified:** `Project_Log.md` (this entry only — strictly read-only investigation, no production files created/moved per Phase 1 scope)

---

### Part 1: Current vs. Target Monorepo File Mapping

| Current Location | Type | Purpose | Target Next.js Location |
|---|---|---|---|
| `index.html` (root) | Public | Dead meta-refresh to `/hub`, unreachable (see Part 2) | `src/app/(marketing)/page.tsx` |
| `inventory.html` (root) | Public | Live public inventory display (de facto homepage today via vercel.json redirect) | `src/app/(marketing)/inventory/page.tsx` |
| `gallery.html` (root) | Public | Printed-object showcase | `src/app/(marketing)/gallery/page.tsx` |
| `contact.html` (root) | Public | Web3Forms contact form | `src/app/(marketing)/contact/page.tsx` |
| `meettheteam.html` (root) | Public | Family team bios | `src/app/(marketing)/team/page.tsx` |
| `request.html` (root) **+** `src/pages/public/request.html` (duplicate, byte-identical, confirmed via `fc`) | Public | Print-queue submission form, `?shop=` tenant gate | `src/app/(marketing)/request/page.tsx` — single copy, duplication eliminated |
| `hub.html` (root) **+** `src/pages/admin/hub.html` (duplicate, byte-identical, confirmed via `fc`) | Admin | 2,689-line monolith: queue mgmt, inventory CRUD, auth lockscreen, Realtime | Decomposed into `src/app/(dashboard)/hub/page.tsx` + `src/components/hub/{QueueTable,InventoryManager,AuthGate}.tsx` + `src/lib/supabase/{client,queries}.ts` |
| `main.cjs` | Desktop | Electron main process, loads `src/pages/admin/hub.html`, injects secrets via `executeJavaScript` | Unchanged — legacy baseline preserved per `.clinerules`; continues pointing at the mirrored static hub.html |
| `js/api/api.js` | Shared logic | Supabase client init, `/api/env` secret fetch, dual Electron/web secret paths | `src/lib/supabase/client.ts` — secrets move to `.env.local` + `NEXT_PUBLIC_*` vars |
| `js/inventory.js` | Shared logic | Public inventory fetch/render/filter (DOM-based) | `src/app/(marketing)/inventory/_components/InventoryGrid.tsx` + `src/lib/supabase/queries.ts` |
| `js/utils/tracker.js` | Shared logic | `site_traffic` visit logging | `src/lib/analytics/track.ts` |
| `js/utils/footer.js` | Shared logic | Global footer injection + version stamp | `src/components/layout/Footer.tsx` |
| `api/env.js` | Serverless | Vercel function exposing secrets as JSON (⚠️ found publicly exploitable, no auth) | **Retired.** Anon key → build-time `NEXT_PUBLIC_SUPABASE_ANON_KEY`; `ADMIN_KEY`/webhook stay server-only, used inside Route Handlers, never returned to client |
| `styles/style.css` | Shared | Single global stylesheet | Tailwind CSS utility classes + `src/app/globals.css` |
| `manifest.json` | PWA | Print-queue PWA manifest | `public/manifest.json` (kept, paths re-verified) |
| `public/images/*`, `images/*`, `gallery/*`, icons | Assets | Static images, redundant split (root `images/` mostly dead) | Consolidated into `public/images/*`, `public/gallery/*` |
| `server.js` | Legacy backend | Express/Render API, confirmed orphaned/unreferenced by current front-end | Not migrated — flagged for future removal consideration |
| `vercel.json` | Config | `cleanUrls`, root `/` → `/inventory` redirect | Redirect removed (see Part 2); rewritten to minimalist config per `.clinerules` |
| `check_and_build.ps1`, `kill_and_build.ps1`, `find_lock*.ps1`, `force_clean_build.ps1`, `run_dist.ps1`, `verify_hub.ps1` | Legacy tooling | Electron build/lock-file automation scripts | **Left untouched** — flagged as a cleanup candidate for a future phase, no action taken now |

---

### Part 2: Root-Cause Diagnosis — "Broken Homepage"

**Finding:** Not a missing file or broken asset path — a **routing conflict between two contradictory redirect mechanisms**, confirmed via live production fetch of `https://www.crafted3dworkshop.com/`:

1. `index.html` contains only a client-side `<meta http-equiv="refresh" content="0; url=/hub">` — intended to send visitors to the Admin Hub.
2. `vercel.json` contains a server-side, permanent redirect: `{ "source": "/", "destination": "/inventory", "permanent": true }`.
3. Vercel's edge redirect fires **before** `index.html` is ever served — confirmed live: the root path always serves `/inventory` content; `index.html`'s meta-refresh to `/hub` only fires if a visitor manually navigates to the explicit `/index.html` path (which bypasses the `/`-only redirect rule).

**Net effect:** The public "Home" brand/story page has never been reachable in production. `index.html`'s redirect-to-`/hub` is dead, unreachable code.

**Confirmed direction (approved by stakeholder):** The Next.js rebuild treats `/` as a true marketing Home page. The `/` → `/inventory` redirect and the dead `/hub` meta-refresh are both eliminated — `/inventory`, `/gallery`, `/request`, `/contact`, `/team` become real sibling routes under `(marketing)`, and `/hub` becomes the authenticated `(dashboard)` entry point reached only via explicit navigation, never an auto-redirect from `/`.

---

### Part 3: Technical & Security Constraints Document

**1. Database Sacrosanctity**
Confirmed live schema references (via README.md/CLAUDE.md + code call-sites — not verifiable against the connected Supabase MCP tool, which points to an unrelated property-management project; flagged as an environment/tooling discrepancy, not a schema issue):
- `colors`: `id, color, finish, description, inStock, colorHex1, colorHex2, colorHex3, shop_slug`
- `site_traffic`: `page_path, user_agent, visit_time`
- `print_jobs`: `id (uuid), requestor_name, project_name, stl_url, filament_id, color_preference, status, created_at, shop_slug`
- `shops`: `shop_slug, shop_name, passcode, logo_url`
All Next.js data access will use identical table/column names and value conventions. No renamed/dropped columns; any new multi-tenant columns must be additive and nullable/backward-compatible.

**2. Multi-Tenant Security Isolation — ⚠️ #1 Priority Gap**
Current state: tenant scoping is enforced entirely client-side via `.eq('shop_slug', ...)` filters read from sessionStorage/URL params, validated once against `shops.passcode`. **No Postgres RLS policy currently keys reads/writes to an authenticated identity** — anyone with the anon key + a `shop_slug` string can read/write any shop's rows directly via the Supabase REST API.
**Mandatory guardrail for this refactor:**
1. Adopt Supabase Auth (magic link/password) for Hub admin logins, replacing the passcode-in-a-table pattern.
2. Attach a custom JWT claim (`shop_slug`) via Auth Hooks or a `profiles` table joined at login.
3. Add RLS policies on `colors`/`print_jobs`: `USING (shop_slug = (auth.jwt() ->> 'shop_slug'))` for authenticated admin access; public anon `SELECT`/`INSERT` remain scoped by an explicit `shop_slug` filter (defense in depth — RLS as the real firewall).
4. Additive only — reuses existing `shop_slug` columns, no schema rename, satisfying Database Sacrosanctity.

**3. Cross-Platform Responsive Execution**
Tailwind responsive breakpoints (`lg:`) to swap layouts: Desktop → persistent sidebar in `(dashboard)` layout; Mobile → bottom-sheet/tab-bar (`fixed bottom-0`, `lg:hidden`). Single React component tree, no separate mobile codepath. PWA wrapper reuses existing `manifest.json` via `public/manifest.json` or `app/manifest.ts`, replacing Electron for mobile/tablet install-to-homescreen while `main.cjs` desktop build remains untouched (SCOPE ISOLATION).

**4. Keep-Alive Architecture**
Replace Uptime Robot with a Vercel Cron Job (`vercel.json` `crons` array — an allowed minimalist config property) hitting a lightweight Route Handler (e.g. `src/app/api/keepalive/route.ts`) on a schedule under Supabase's free-tier inactivity window, running a trivial query. No `functions`/`runtime` block required. Optionally paired with ISR revalidation on the public inventory page as an organic fallback.

---

### Flagged Findings (no action taken — investigation only)
1. **Live secret leak:** `/api/env` publicly returns `ADMIN_KEY` and `DISCORD_WEBHOOK_URL` in plaintext to unauthenticated requests. Recommend rotating both; architecture change in Part 3 Rule 2 closes this pattern going forward.
2. **Supabase MCP tool mismatch:** connected database contains an unrelated schema (`tenants`, `rent_statements`, `maintenance_tickets`) — not this project's Supabase instance. Schema verification relied on code/README inspection only.
3. **Duplicate file pairs:** `hub.html`/`src/pages/admin/hub.html` and `request.html`/`src/pages/public/request.html` are byte-identical twins maintained by hand in parallel — resolved naturally once migrated to single Next.js routes.
4. **Root `images/` vs `public/images/`:** root-level `images/` is dead weight (only contains `Old Photos/`); all live references point to `public/images/*`.
5. **Legacy PS1 build scripts** (`check_and_build.ps1`, `kill_and_build.ps1`, `find_lock*.ps1`, `force_clean_build.ps1`, `run_dist.ps1`, `verify_hub.ps1`) — noted as cleanup candidates for a future phase; left untouched in this pass.

---

### Next Step

Awaiting stakeholder review — **approved**. Proceeding to scaffold the unified Next.js + Tailwind CSS + Supabase monorepo directory shell inside `feature/universal-web-target`, dropping the legacy `/api/env` endpoint pattern and migrating secrets to build-time/server-only env vars per the constraints above.

---

## Previous Entry — 2026-07-12 (Git ↔ Vercel Deployment Connection Verified & Restored)


### Task: Verify and Connect Git Remote to Vercel Project

**Branch:** `main`
**Files Modified:** `Project_Log.md` (this entry only — no code/schema changes)

---

### Investigation Summary

Performed a full read-only audit of the Git ↔ Vercel deployment pipeline for the `c3dw-sandbox` Vercel project (`prj_eIbeif6zQbMKueYzoW3ubshwccRW`):

- **Local/remote Git state:** `main` was up to date with `origin/main` (commit `62294da`), working tree clean — no uncommitted changes.
- **GitHub repo resolution:** The `origin` remote (`https://github.com/blast1221/filament_inventory.git`) resolves via the GitHub API to `topflight-dev/filament_inventory` (public repo, org/owner alias — noted for awareness, not an error).
- **Vercel CLI auth:** The Vercel CLI (v54.14.0) installed on this machine had **no authenticated session** (`auth.json` absent from CLI config dirs) — all `vercel whoami`, `vercel project ls`, and `vercel git connect` invocations returned `Error: Not authorized`. CLI-based verification/connection was not possible from this sandboxed environment.
- **Live production check (critical finding):** Fetched `https://www.crafted3dworkshop.com/hub` directly and found it was serving **stale code** — missing the hover-dropdown "Request Queue" nav feature (`Active Queue` / `Completed Archive`) that had already landed on `main` at commit `62294da`. This confirmed the Vercel project's Git integration was **not actively deploying** new commits pushed to `main`, despite the repo history being correct and up to date.

---

### Resolution

1. **User action:** Verified and reconnected the GitHub repository in the Vercel Dashboard (Project → Settings → Git). Confirmed `filament_inventory` is now linked with **Production Branch = `main`**.
2. **Trigger deploy:** Since reconnecting a Git integration does not automatically redeploy already-existing commits, an empty trigger commit (`4a1a5c1` — "chore: trigger initial vercel build after git connection") was pushed to `origin/main` to kick off the first Git-driven build under the newly-restored integration.
3. **Post-deploy verification:** Re-fetched `https://www.crafted3dworkshop.com/hub` (cache-busted) after the push and confirmed the live HTML now contains the `.hub-tab-dropdown-wrapper` markup — `🖨️ Request Queue ▾`, `📥 Active Queue`, `📦 Completed Archive` — matching the code at commit `62294da`/`4a1a5c1`.

**Status: ✅ RESOLVED.** The Vercel project is now correctly connected to the GitHub `main` branch, and the Git-driven auto-deploy pipeline is confirmed working end-to-end — pushes to `main` will trigger production builds/promotions automatically going forward, per the `GIT-DRIVEN DEPLOYMENTS ONLY` rule in `.clinerules`.

No database schema changes were made. No code files were modified as part of this task — this was strictly an investigation, dashboard reconnection (by user), and verification task.

---

### Next Step

None required — deployment pipeline is confirmed healthy. Continue normal workflow: commit → push to `main` → Vercel auto-builds/deploys. No manual `vercel --prod` CLI deploys needed or permitted.

---

## Previous Entry — 2026-07-12 (Request Queue Hover Dropdown)


### Task: Hover-Activated Navbar Dropdown for Request Queue

**Branch:** `main`
**Files Modified:**
- `hub.html` (root — Electron desktop admin panel)
- `src/pages/admin/hub.html` (mirrored copy — Vercel PWA cloud target)

---

### Summary

Refactored the "Request Queue" tab button in the admin hub nav bar into a hover-activated dropdown component, without altering any existing tab-switching behavior.

**UI Changes:**
- Wrapped the existing `🖨️ Request Queue` tab button in a new `.hub-tab-dropdown-wrapper` div; label updated to `🖨️ Request Queue ▾`.
- Added a hidden `.hub-tab-dropdown-menu` containing two new items: `📥 Active Queue` and `📦 Completed Archive`.
- New CSS is purely additive (no existing rules modified): `:hover` pseudo-class on the wrapper reveals the menu via `display:flex` + a subtle fade/slide keyframe animation. Menu is `position:absolute` with `z-index:500`, floating safely above the `.queue-table` rows without shifting any existing layout elements.

**Filtering Logic (Server-Side):**
- Added `queueStatusFilter` state variable (`'active'` | `'completed'`, defaults to `'active'`).
- Added `setQueueFilter(filter)` handler — updates state, toggles the `.active` class on dropdown items, and calls `fetchQueue()`.
- Modified `fetchQueue()` to apply the filter **server-side** via the Supabase query builder before executing:
  - `'active'` → `.neq('status', 'Completed')`
  - `'completed'` → `.eq('status', 'Completed')`
- No client-side filtering of already-fetched data — every filter switch triggers a fresh, scoped Supabase query (still respecting the existing `shop_slug` multi-tenant `.eq()` filter).

**Verification:**
- Confirmed `hub.html` and `src/pages/admin/hub.html` remain byte-identical post-edit via `fc` (File Compare) — "FC: no differences encountered".
- No database schema changes — `print_jobs.status` column and values used as-is (SACRED AND IMMUTABLE per project rules).

---

### Next Step

Run a standard Git push to `main` to trigger Vercel's Git-integration automated production deployment:
```powershell
git add hub.html src/pages/admin/hub.html Project_Log.md
git commit -m "feat: hover dropdown for Request Queue with server-side Active/Completed filtering"
git push origin main
```
No manual `vercel --prod` deploys — Vercel's native Git integration handles build + promotion automatically once the commit lands on `main`.

---

## Previous Entry — 2026-07-12 (Domain Synchronization)


### Task: Global Domain URL Update & Alignment Audit

**Branch:** `feature/universal-web-target`
**Files Modified:**
- `request.html` (root — PWA/web target)
- `src/pages/public/request.html` (mirrored copy)

---

### Investigation Summary

Performed a full codebase sweep (via PowerShell `Select-String`, excluding `node_modules`, `.git`, `Backups`, `Old_Site`, `Downloads`, `Documents`, `dist`) for stale `.vercel.app` deployment URLs. Checked `hub.html`, `src/pages/admin/hub.html`, `vercel.json`, `manifest.json`, `api/env.js`, `js/api/api.js`, `js/utils/tracker.js`, `js/utils/footer.js`, and `js/inventory.js`.

**Findings:**
- `hub.html` / `src/pages/admin/hub.html` — clean, no hardcoded Vercel URLs.
- `request.html` and `src/pages/public/request.html` — each contained one hardcoded reference in the Discord webhook embed's dashboard link: `https://c3dw-sandbox.vercel.app/hub`.
- `.vercel\project.json` — contains `"projectName": "c3dw-sandbox"`. This is Vercel CLI project-link metadata (not a live URL reference) and was intentionally left untouched, as altering it risks breaking the CLI's project→deployment link.
- `CNAME` already correctly points to `www.crafted3dworkshop.com` (legacy artifact from prior GitHub Pages hosting; harmless to leave in place).

---

### Fix Applied

Replaced the stale Discord embed dashboard link in both `request.html` files:

```diff
- description: '[🔗 View Dashboard](https://c3dw-sandbox.vercel.app/hub)',
+ description: '[🔗 View Dashboard](https://www.crafted3dworkshop.com/hub)',
```

Verified via `Select-String` post-edit that both files now reference `www.crafted3dworkshop.com` and no `.vercel.app` references remain in either file.

---

### Multi-Tenant `?shop=` Routing — Verification

Confirmed the shop-slug gating logic in both `request.html` files is **hostname-independent**:

```javascript
const urlParams = new URLSearchParams(window.location.search);
const shopSlug  = (urlParams.get('shop') || '').trim();
```

This reads only the query string (`?shop=xyz`), never `window.location.hostname`, and validates the slug against the Supabase `shops` table via `window.getSupabaseClient()`. No code changes were required — the routing logic will function identically under the new `www.crafted3dworkshop.com` domain with no regressions.

No database schema changes were made. The `shops`, `colors`, `site_traffic`, and `print_jobs` tables remain entirely untouched.

---

### Previous Entry (2026-07-12) — Update Core Deployment Rules — Ban Manual CLI Production Deploys

**Branch:** `feature/universal-web-target`
**Files Modified:**
- `.clinerules`

Added a new rule to the "⚠️ CRITICAL VERCEL & CLOUD-NATIVE DEPLOYMENT CONSTRAINTS" section of `.clinerules`:

```
GIT-DRIVEN DEPLOYMENTS ONLY: Never run manual production CLI deployments (e.g., `vercel --prod` or `vercel deploy --prod`). All production deployments must be triggered exclusively by pushing commits to the connected remote Git repository, allowing Vercel's native Git integration to manage builds and promotion automatically.
```

**Reason:** The previous "Next Step" entry in this log (2026-05-25) instructed running `vercel --prod` manually to push a fix live — directly conflicting with the Git-driven deployment architecture the project has since standardized on. This entry corrects that instruction and locks the rule in going forward so all future deploys flow through Vercel's Git integration only.

---

### Previous Entry (2026-05-25) — Fix Reset Mutation Bug on Order Deletion Queue


### Task: Fix Reset Mutation Bug on Order Deletion Queue

**Branch:** `feature/universal-web-target`
**Files Modified:**
- `hub.html` (root — PWA/web target)
- `src/pages/admin/hub.html` (mirrored copy)

---

### Bug Summary

The `deleteSelected()` function in the print queue admin panel had a missing state reset on the **success path** of the Supabase batch delete mutation.

**Root Cause:** After `await fetchQueue()` resolved successfully, three things were never unwound:
1. `deleteBtn.disabled` remained `true` — button was permanently greyed out for the session
2. `deleteBtn.textContent` remained `'⏳ Deleting...'` — stuck loading label
3. Row checkboxes were not explicitly cleared post-delete (belt-and-suspenders gap)

The **error path** already had correct resets; only the success path was missing them.

---

### Fix Applied

Inside the `try` block of `deleteSelected()`, immediately after `await fetchQueue()` resolves, the following success-path state reset block was added to both hub files:

```javascript
// ── SUCCESS STATE RESET ──────────────────────────────────────────
deleteBtn.disabled = false;
deleteBtn.textContent = '🗑️ Delete Selected';

document.querySelectorAll('.job-checkbox').forEach(cb => { cb.checked = false; });
const masterCb = document.getElementById('select-all-downloads');
if (masterCb) { masterCb.checked = false; masterCb.indeterminate = false; }
updateDeleteBtnState();
// ────────────────────────────────────────────────────────────────
```

No schema changes were made. The `print_jobs` table structure remains entirely untouched.

---

### Previous Entry (2026-05-24) — Production Deployment — Validation Gate Live

**Commit:** `87227df`
**Deploy:** ✅ Live at https://c3dw-sandbox.vercel.app

---

### Next Step

Commit and push the patched `request.html` files (root + `src/pages/public/`) to the `feature/universal-web-target` remote branch to trigger Vercel's Git-driven build/deploy pipeline. Once deployed, verify end-to-end: submit a test print request → confirm the Discord notification's "View Dashboard" link resolves to `https://www.crafted3dworkshop.com/hub` and loads correctly, and confirm `?shop=<slug>` URLs continue to gate/validate correctly against the live Supabase `shops` table under the production domain.
