# C3DW Workshop — Project Log

## Latest Entry — 2026-07-13 (Request Page — Dynamic Multi-Tenant Shop-Slug Fallback Chain)

### Task: Fix "Shop Not Found" error on `/request` when accessed without a `?shop=` URL param

**Branch:** `feature/universal-web-target`
**Files Modified:**
- `web/src/app/(marketing)/request/page.tsx`
- `web/.env.local.example`

### Root Cause
`RequestPageInner` derived `shopSlug` exclusively from `searchParams.get('shop')`. Visiting `/request` directly (no query string) produced an empty string, which the shop-validation gate `useEffect` treated as invalid, immediately rendering the "Shop Not Found" card — even though this deployment has one clearly active shop/tenant.

### Added / Changed
- Implemented a **3-tier dynamic fallback chain** for shop-slug resolution, preserving full multi-tenant discipline for future white-labeling/scaling:
  1. `?shop=` URL search param (unchanged — real multi-tenant override, always wins if present).
  2. `NEXT_PUBLIC_DEFAULT_SHOP_SLUG` public build-time env var (per-deployment default; documented in `.env.local.example`, safe to expose to the browser since it's a slug, not a secret).
  3. Hardcoded literal fallback `'crafted3dworkshop'` as the final safety net, matching this shop's `shops.shop_slug` row.
- No JSX/markup, styling, or visual changes — purely the slug-resolution logic at the top of `RequestPageInner`.
- All downstream queries (`shops` gate check, branding fetch, `colors` fetch, `print_jobs` insert `shop_slug` column) were already parameterized off the single `shopSlug` variable and required no further changes.

### Verification
- `npx --no-install next build` inside `/web` (Turbopack production build, includes the full TypeScript typecheck pass) — **Compiled successfully, zero TypeScript errors.** `/request` correctly listed as a static (○) prerendered route.

### Next Step
None outstanding for this fix. If this app is ever spun out as a commercial multi-tenant product, tier 2 (`NEXT_PUBLIC_DEFAULT_SHOP_SLUG`) is the only value that should need to change per-deployment.

---

## Previous Entry — 2026-07-13 (Dark-Mode Bleed-Through Fix — Top/Bottom Black Bars)


### Task: Eliminate lingering black bars above the Header and below the Footer on shorter pages

**Branch:** `feature/universal-web-target`
**Files Modified:**
- `web/src/app/globals.css`
- `web/src/app/layout.tsx`
- `web/src/app/(marketing)/layout.tsx`

### Root Cause
`globals.css` (Next.js's default scaffold) still shipped a `@media (prefers-color-scheme: dark)` block that flipped the CSS var `--background` to near-black (`#0a0a0a`) whenever a visitor's OS/browser had dark mode enabled, and the `<body>` element never had an explicit background color of its own — it simply inherited `var(--background)`. Since the site's `Header`/`Footer` components already painted their own cream (`#FDFBF7`) backgrounds, any sliver of raw `<body>` peeking out above the Header (thin top bar) or below the Footer on pages shorter than the viewport (thick bottom bar) rendered as solid black instead of cream. `Header.tsx` and `Footer.tsx` themselves were audited and found already correctly using `bg-[#FDFBF7]` with faint `border-[#3D3D3D]/10` hairlines — no `bg-black`/`bg-zinc-900` classes were present in either file.

### Fixed
- `globals.css` — Removed the `prefers-color-scheme: dark` media query entirely (this is a single fixed warm-theme brand site with no dark-mode variant) and locked `:root` tokens to `--background: #FDFBF7` / `--foreground: #3D3D3D` so the color scheme is deterministic regardless of the visitor's system preference. Rule also now targets both `html, body` explicitly.
- `layout.tsx` (root) — Added an explicit `bg-[#FDFBF7] text-[#3D3D3D]` className directly on `<body>` as a defense-in-depth guard against any FOUC/var-resolution timing gap.
- `(marketing)/layout.tsx` — Added `bg-[#FDFBF7]` to the outer flex wrapper `<div>` so the marketing route group's own container never exposes a black gap on short pages before the Footer renders.

**Business logic preserved:** Purely a CSS/background-color fix — no Supabase queries, routing, or component logic touched.

### Verification
- `npx tsc --noEmit -p tsconfig.json` inside `/web` — **passes clean, zero TypeScript errors.**

### Next Step
None outstanding for this fix — monitor production after next deploy to confirm the bars are gone across all marketing routes (Home, Inventory, Gallery, Contact, Team) and at various short viewport heights.

---

## Previous Entry — 2026-07-13 (Site-Wide "Creative Studio" Theme Rollout)


### Task: Bring the remaining shared components and public routes into visual alignment with the "Creative Studio" warm theme established on the Home page

**Branch:** `feature/universal-web-target`
**Files Modified:**
- `web/src/components/layout/Header.tsx`
- `web/src/components/layout/Footer.tsx`
- `web/src/app/(marketing)/inventory/page.tsx`
- `web/src/app/(marketing)/inventory/_components/InventoryGrid.tsx`
- `web/src/app/(marketing)/gallery/page.tsx`
- `web/src/app/(marketing)/contact/page.tsx`
- `web/src/app/(marketing)/team/page.tsx`

### Summary

Extended the warm "Creative Studio" palette (cream `#FDFBF7` background, white `rounded-2xl` soft-shadow cards, terracotta `#E76F51` primary accent, sage `#2A9D8F` secondary accent, deep charcoal `#3D3D3D` text) from the already-redesigned Home page across every remaining shared component and public route:

- **`Header.tsx`** — replaced the legacy `bg-gradient-to-b from-[#fff1eb] to-[#ace0f9]` blue/peach gradient with a flat cream background; title/subtitle recolored to charcoal/terracotta; nav bar background switched to white with a subtle charcoal-tinted border; active nav link now terracotta with a terracotta underline (was blue/orange), inactive links hover to sage instead of a plain underline.
- **`Footer.tsx`** — background changed to match the cream page body, border/text recolored to charcoal tones, version-stamp badge now uses the terracotta accent instead of zinc gray.
- **`inventory/page.tsx`** — wrapped the page body in the cream background container (matching Home), heading recolored to charcoal.
- **`InventoryGrid.tsx`** — search input and finish-filter pills restyled with terracotta (active state) and sage (hover state) accents replacing the legacy blue; each filament swatch card converted from a plain bordered box into a soft-shadowed white `rounded-2xl` panel with a hover-lift transition, and a new **sage-tinted "In Stock" badge** was added to each card (purely presentational — the grid already only ever receives `inStock=true` rows fetched server-side via `getInStockColors()`, so this is an additive visual label, not new logic or a new query).
- **`gallery/page.tsx`** — cream background wrapper; each photo now sits inside a white `rounded-2xl` soft-shadow card with hover-lift, replacing the plain bordered thumbnail box.
- **`contact/page.tsx`** — cream background wrapper; the Web3Forms form container converted to a white `rounded-2xl` soft-shadow panel; all input/select/textarea focus rings switched from the legacy brown `hsl(25,36%,37%)` accent to terracotta; submit button restyled as a terracotta gradient-shadow CTA matching Home's button language; success message recolored to sage. All Web3Forms fields (honeypot, hidden `access_key`/`from_name`, hCaptcha div), validation rules, and the AJAX submit handler are untouched.
- **`team/page.tsx`** — cream background wrapper; intro section and each family bio card converted to white `rounded-2xl` soft-shadow panels with hover-lift, avatar ring accent changed from orange-300 border to a terracotta-tinted ring. All six bios and copy preserved verbatim.

**Business logic preserved:** No Supabase queries, table/column names, form validation rules, or submission handlers were touched in any file — every change in this pass was scoped strictly to Tailwind `className` values and inline style colors. `request/page.tsx` was intentionally left out of scope (not listed in the task) — its own hardcoded shop-branding header/gradient and form remain as-is; it does, however, share nothing with `Header.tsx` since it renders its own inline header markup, so no incidental style migration occurred there.

**Root-level files touched:** none. `hub.html`, `src/pages/admin/hub.html`, `main.cjs` untouched.

---

### Verification
- `npx tsc --noEmit -p tsconfig.json` inside `/web` — **passes clean, zero TypeScript errors**. (Note: `web/package.json` has no standalone `build` script wired for this sandbox's non-interactive shell; a full `next build` was not run, but the strict type-check across the whole project surfaced no errors introduced by this styling pass.)

---

### Next Step

Consider a future pass to apply the same "Creative Studio" treatment to `request/page.tsx`'s own hardcoded header/card markup (currently still using the legacy blue/peach gradient + brown accent, since it doesn't consume the shared `Header.tsx` component), pending explicit user approval since it's a live multi-tenant customer-facing form.

---

## Previous Entry — 2026-07-13 (Homepage "Creative Studio" Redesign)


### Changed
- `web/src/app/(marketing)/page.tsx` — Fully redesigned the landing page away from the prior storefront/robotic feel into a warm "Creative Studio" personal About-Me theme:
  - **Palette:** cream background (`#FDFBF7`), pure white `rounded-2xl` cards with soft shadows, Terracotta (`#E76F51`) and Sage Green (`#2A9D8F`) accents, deep charcoal (`#3D3D3D`) body/heading text instead of pure black/zinc.
  - **Hero:** replaced the old 3-image auto-crossfade slideshow (and its inline `<style>` keyframe block) with a split hero — personal intro copy + soft-framed, softly-overlapping duo of `luis1.jpg`/`ellen.jpg` photos with rounded-2xl white borders and soft shadows.
  - **Our Story / Our Purpose:** merged into one clean narrative white card with the original verbatim founder story copy, a sage-accented pull-quote, and a redesigned 3-item feature list (Live Inventory / Premium Finishes / Collaborative Building) replacing the old plain bullet list.
  - **Inventory preview teaser:** new compact white card inviting users to check the live filament inventory, with a sage CTA button.
  - **Say Hello CTA:** new centered, welcoming card-based CTA section linking directly to `/contact`, using the terracotta accent button.
  - All interactive elements use smooth `transition-all duration-300` hover states (lift + shadow/color shift) for a friendly, premium feel. No stubs/placeholders — file is fully production-ready.

**Next Step:** None outstanding from this task. Consider a future pass to restyle the shared `Header.tsx` gradient to match the new cream/terracotta/sage palette site-wide (currently still uses the legacy blue/peach gradient), pending explicit user approval since it's a shared component across all marketing pages.

---

## Prior Entry — 2026-07-13 (Governance Rules Update — Architectural Contract)


### Changed
- `.clinerules` — Appended five new permanent governance sections: **OPERATING SYSTEM & ENVIRONMENT CONSTRAINTS** (Windows/PowerShell-only, no OS-guessing commands), **NO-EXECUTION & COMPILATION STANDARDS** (no placeholders/TODOs, no persistent dev-server execution, clean up terminal panes), **ARCHITECTURAL BOUNDARY RULES** (secrets boundary for `.env.local`, Supabase as record authority for stock/quantity data), **DATABASE WRITE-ACCESS & SCHEMA GUARDRAILS** (no raw DDL without explicit review, all mutations must be scoped with WHERE predicates), and **MASTER ECOSYSTEM BLUEPRINT & LOGGING** (Next.js/TypeScript/Tailwind/Supabase stack declaration + mandatory changelog requirement). All pre-existing sections (Branch Architecture, Path & Boundary Rules, Terminal & Environment, Persistent Memory & Reporting, Vercel/Cloud-Native Deployment Constraints) preserved unchanged.
- `.clineignore` — Confirmed/rewritten to the exact canonical ignore set: `**/node_modules/`, `.next/`, `.vercel/`, `.git/`, `**/__pycache__/`, `*.pyc`, `.env`, `*.env.local`, `.DS_Store`.

**Next Step:** None outstanding from this task — governance contract is now permanently in effect for all future sessions in this repo.

---

## Prior Entry — 2026-07-13 (Admin Hub Dashboard Migration — Full 1:1 Decomposition)


### Task: Port `hub.html` (2,689 lines, legacy Electron admin dashboard) into decomposed React/Tailwind components under `web/src/`

**Branch:** `feature/universal-web-target`
**Files Added:**
- `web/src/lib/supabase/hub-queries.ts` — typed data-access layer (queue CRUD, color/finish CRUD, shop passcode validation) using the SACRED/IMMUTABLE `print_jobs`, `colors`, `shops` tables/columns exactly as-is
- `web/src/hooks/useHubToast.tsx` — shared toast hook + `<HubToast/>` presentational component
- `web/src/components/hub/AuthGate.tsx` — 1:1 port of the legacy sessionStorage + passcode lockscreen (Option A, per user decision — real Supabase Auth/RLS deferred)
- `web/src/components/hub/HubShell.tsx` — brand bar, sign-out, tab nav with the hover-activated "Request Queue" Active/Completed dropdown
- `web/src/components/hub/QueueTable.tsx` — queue fetch/render, inline edit, batch-delete checkboxes, auto-refresh toggle, Supabase Realtime `postgres_changes` INSERT subscription + toast
- `web/src/components/hub/InventoryManager.tsx` — add-filament form, finish dropdown w/ "Add New Finish" prompt, collapsible finish-grouped list, optimistic in-stock toggle, delete, search
- `web/src/components/hub/InvEditModal.tsx` — color/finish edit modal invoked from InventoryManager

**Files Modified:**
- `web/src/app/(dashboard)/hub/page.tsx` — replaced the Phase 2 placeholder stub; now wires `AuthGate` → `HubShell` → `QueueTable`/`InventoryManager` together

### Summary

Completed the full decomposition of the legacy Admin Hub into modular Next.js client components, converting the ~950-line inline dark-theme `<style>` block to Tailwind utility classes (matching the established dark palette from the public site's marketing pages), with two small scoped `<style>` blocks retained only for the auth-shake and hover-dropdown keyframe/scrollbar effects that aren't expressible as pure Tailwind utilities.

**Auth approach (per explicit user decision):** Kept the legacy 1:1 behavior — `sessionStorage` flags (`c3dw_hub_auth`/`c3dw_shop_slug`/`c3dw_shop_name`) gate access; the passcode form validates `shop_slug` + `passcode` directly against the `shops` table via the anon key. This preserves the known Phase 1-flagged security gap (anyone with the anon key can query `shops.passcode`) — real Supabase Auth + RLS is intentionally deferred to a dedicated future session, matching the roadmap's "AuthGate.tsx ported 1:1 first" plan.

**Realtime:** `QueueTable` subscribes to `postgres_changes` INSERT events on `print_jobs` and toasts + refetches on new submissions. The Electron-only native `Notification` API branch (gated on `file:` protocol in the legacy code) was dropped since this is a pure web target — desktop notifications remain exclusively in the untouched `hub.html`/`main.cjs` path.

**Database Sacrosanctity:** No schema changes. All queries in `hub-queries.ts` reuse the exact existing column names (`print_jobs.requestor_name/project_name/stl_url/filament_id/color_preference/status/created_at/shop_slug`, `colors.color/finish/description/inStock/colorHex1-3/shop_slug`, `shops.shop_slug/shop_name/passcode`).

**Root-level files touched:** none. `hub.html`, `src/pages/admin/hub.html`, `main.cjs` remain byte-for-byte untouched per SCOPE ISOLATION — the Electron desktop build continues to use its own legacy files unmodified.

**Build verification:** `npm run build` inside `/web` completed successfully (Next.js 16.2.10, Turbopack) — `/hub` compiles as a static-shell client route alongside all existing marketing routes with zero TypeScript errors.

---

### Next Step

Manually test the live `/hub` route end-to-end against a real shop's `shop_slug`/`passcode` (queue CRUD, inventory CRUD, Realtime toast on new submission) once deployed via the next Git-driven push. Follow-up session: replace the passcode gate with real Supabase Auth (magic link or password) + RLS policies keyed to a `shop_slug` JWT claim, per the Phase 1 roadmap's long-term auth plan.

---

## Previous Entry — 2026-07-13 (Env Audit — Supabase SSR Key Disconnect)


### Task: Audit `web/.env.local` to diagnose live "@supabase/ssr" missing key error

**Branch:** `main`
**Files Modified:** none (read-only audit)

### Summary

Inspected `web/.env.local` (5 lines) against `web/.env.local.example` and the actual consumers `web/src/lib/supabase/client.ts` / `server.ts`.

**Findings:**
- `NEXT_PUBLIC_SUPABASE_URL` — present, correct Supabase project URL format.
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — present, valid JWT structure, confirmed `"role":"anon"` (correct public/browser-safe key, not a service role key).
- `ADMIN_KEY` — present but **empty**.
- `DISCORD_WEBHOOK_URL` — present but **empty**.

Confirmed via code inspection that `@supabase/ssr`'s `createBrowserClient`/`createServerClient` calls in `client.ts`/`server.ts` reference **only** `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` — `ADMIN_KEY`/`DISCORD_WEBHOOK_URL` are unrelated (used only by the separate `notify-discord` Route Handler) and are not the cause of the SSR error.

**Root cause diagnosed:** `.env.local` is git-ignored and never deployed to Vercel. The live "@supabase/ssr" missing key error is almost certainly caused by `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` not being registered as Environment Variables in the Vercel Project Settings, leaving them `undefined` at cloud build time. Attempted to confirm directly via `vercel env ls`, but the project isn't linked in this sandbox (`.vercel` not linked).

**Resolution:** User will add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` manually via the Vercel dashboard (Production/Preview). Per `.clinerules`, no manual `vercel --prod` deploy was run — fix will take effect on next Git-driven deployment.

---

### Next Step

Await confirmation that the live site's `@supabase/ssr` error is resolved after the user adds the two `NEXT_PUBLIC_*` keys in the Vercel dashboard and the next git push triggers a fresh deployment. If still broken, check Vercel build logs for other missing envs (e.g. mismatched Preview vs Production scoping).

---

## Previous Entry — 2026-07-13 (Phase 4 — Homepage Content Restoration)


### Task: Fix "root domain shows Inventory Grid" report — port real legacy Home page content into `web/src/app/(marketing)/page.tsx`

**Branch:** `main`
**Files Modified:**
- `web/src/app/(marketing)/page.tsx` — replaced the Phase 2 placeholder stub with a full Tailwind port of the legacy `index.html` homepage
- `web/public/images/placeholder.jpg` — copied from the legacy root-level `public/images/` folder (new file, additive copy only; `luis1.jpg`/`ellen.jpg`/`jordiluis1.jpg` were already present in `web/public/images/` from the Phase 3 Team page port)

---

### Summary

Investigated the reported bug ("visiting `/` displays the Inventory Grid, and 'Home' just reloads the inventory"). Inspected `web/src/app/page.tsx` per the task instructions — **this file does not exist**. Next.js App Router route groups mean `web/src/app/(marketing)/page.tsx` is what actually renders at `/`, and `web/src/app/(marketing)/inventory/page.tsx` renders at `/inventory` — these were already correctly separated architecturally (confirmed: the inventory grid component/`getInStockColors()` fetch only exists in the `/inventory` file). Also confirmed the current `web/vercel.json` has no `/` → `/inventory` redirect (that legacy redirect was already removed during the Phase 2 rebuild, per the Phase 1 diagnosis entry below).

**Real root cause identified:** the `(marketing)/page.tsx` Home page was still just a Phase 2 placeholder stub (a generic one-paragraph "Welcome to Crafted 3D Workshop" message) — it never contained the actual rich legacy homepage content (hero section, "Our Story"/"Our Purpose" sections, CTA), which made the site feel broken/incomplete even though the routing itself was correct.

**Fix applied:** Recovered the original legacy `index.html` homepage content from git history (commit `e6b49c4`, the last pre-meta-refresh version, confirmed via `git show`) and ported it 1:1 (all copy preserved verbatim) into `(marketing)/page.tsx` as Tailwind v4 markup:
- **Hero slideshow section:** the three-image crossfading background slideshow (`luis1.jpg` / `ellen.jpg` / `jordiluis1.jpg`) with the "Our Story" text-box overlay, reimplemented with Tailwind utility classes for layout/positioning plus a small scoped inline `<style>` block for the `@keyframes fadeSlider` crossfade animation (arbitrary keyframe animations aren't expressible as pure Tailwind utilities).
- **"Our Purpose" two-column section:** image (`placeholder.jpg`) + feature list (Explore Our Live Inventory / Premium Finishes / Collaborative Building), laid out via a responsive Tailwind flex row (reversed on `lg:`), replacing the legacy `.two-column.reverse` CSS.
- **CTA section:** "Ready to see what's in stock?" → `<Link href="/inventory">View Color Inventory →</Link>`, styled as a green rounded button matching the legacy `.cta-button` hover-lift behavior.
- Copied the one missing image asset (`placeholder.jpg`) into `web/public/images/`; the three portrait photos were already present from the earlier Team page port.

**Root-level files touched:** none — `index.html` was only read (via `git show`, historical revision) for content recovery, never modified. `hub.html`/`src/pages/admin/hub.html`/`main.cjs` untouched.

---

### Verification
- `npm run build` inside `/web` — **passes clean**. Route table unchanged (`○ /`, `○ /contact`, `○ /gallery`, `○ /hub`, `ƒ /inventory`, `○ /request`, `○ /team`, `ƒ /api/keepalive`, `ƒ /api/notify-discord`) — confirms `/` is a static prerendered route showing the new Home content, and `/inventory` remains its own separate dynamic route, unaffected by this change.

---

### Next Step

Continue the Hub admin dashboard decomposition (`AuthGate.tsx` → `HubShell.tsx` → `QueueTable.tsx` → `InventoryManager.tsx`/`InvEditModal.tsx`) per the roadmap locked in during the previous entry. Root `main.cjs`/Electron build and both legacy `hub.html` files remain completely untouched throughout.

---

## Previous Entry — 2026-07-13 (Phase 4 — Editor Environment & Navigation Pass)

### Task: Workspace config setup + Header nav-link verification, ahead of the dedicated Hub decomposition session

**Branch:** `feature/universal-web-target`
**Files Created/Modified:**
- `.vscode/settings.json` (repo root, new) — isolates ESLint's working directory to `./web`, pins `typescript.tsdk` to `web/node_modules/typescript/lib`, and excludes `**/node_modules`/`**/.next` from both the file explorer and search.
- `.vscode/tasks.json` (repo root, new) — adds a "Next.js Dev Server" task running `npm run dev` with `cwd` pinned to `${workspaceFolder}/web`.

---

### Summary

Per this task's explicit file-unban, inspected both `hub.html` (root) and `src/pages/admin/hub.html` in full (2,689 lines each, confirmed byte-identical twins per the Phase 1 audit) to prepare a structural decomposition plan for the upcoming dedicated Hub dashboard session.

**Workspace config:** Added the two `.vscode/*.json` files at the repository root (permitted per this task's scope exception) so VS Code's ESLint/TS tooling correctly targets the `/web` Next.js project instead of misfiring against the legacy root-level vanilla-JS files, and so a one-click dev server task is available.

**Header "Home" link investigation:** Inspected `web/src/components/layout/Header.tsx` — the `NAV_LINKS` array's first entry is already `{ href: '/', label: 'Home' }` (line 4). Ran a byte-level check (`Get-Content -Encoding Byte`) confirming the file has no BOM and no non-ASCII/encoding artifacts around the nav array, and a targeted regex extraction confirming the `href` value between the quotes is exactly a single `/` character (byte 47, i.e. ASCII `/`) with no hidden whitespace, zero-width characters, or truncated path. **No code change was required** — the link was already correct; nothing was silently stalling it. This was a verify-only outcome, documented here rather than a no-op edit.

**Root-level files touched:** none besides this log and the new root `.vscode/` configs. `hub.html` and `src/pages/admin/hub.html` were read-only for this pass (structural planning), never edited.

---

### Verification
- `npm run build` inside `/web` — **passes clean**. Route table unchanged from the last entry (`/`, `/contact`, `/gallery`, `/hub`, `/inventory` (dynamic), `/request`, `/team`, `/api/keepalive`, `/api/notify-discord`), confirming the config-only changes introduced no regressions.

---

### Hub.html Structural Decomposition Plan (roadmap for next dedicated session)

Having now read the full legacy file end-to-end, the proposed component breakdown is:

- **`AuthGate.tsx`** — the shop-slug + passcode lockscreen overlay (`#auth-overlay`, `handleAuth()`). Ported 1:1 first as a client component wrapping the dashboard; long-term replaced by real Supabase Auth + RLS per Phase 1 Part 3 Rule 2.
- **`HubShell.tsx`** — brand bar + tab nav (`.hub-brand-bar`, `.hub-tab-nav`, the Request Queue hover-dropdown w/ Active/Completed filter, Sign Out button), owns `activeTab` state and renders the two panes below.
- **`QueueTable.tsx`** — the Print Queue tab: `fetchQueue`/`renderQueue`, inline edit (`editRow`/`saveRow`/`cancelEdit`), `cycleStatus`, batch-delete checkbox selection, auto-refresh toggle, and the Supabase Realtime `postgres_changes` INSERT subscription (instant new-job toast + desktop-only `Notification` API branch).
- **`InventoryManager.tsx`** — the Filament Inventory tab: add-filament form (dynamic finish dropdown incl. "+ Add New Finish"), collapsible finish-grouped item list, stock toggle with the optimistic `localStorage` pending-state pattern, delete, and a nested **`InvEditModal.tsx`** for the color/finish edit modal.
- **`useHubToast.ts`** — small shared hook wrapping the toast notification pattern (`#hub-toast`), used by both Queue and Inventory panes.
- **Styling:** convert the ~950-line inline `<style>` block to Tailwind utility classes matching the existing dark theme, following the same conversion approach already used for `request/page.tsx`.
- **Data layer:** extend `lib/supabase/queries.ts` with typed functions (`getQueueJobs`, `updateJobStatus`, `deleteJobs`, `getAdminColors`, `upsertColor`, etc.) — all existing table/column names (`print_jobs`, `colors`, `shops`) reused exactly as-is, satisfying Database Sacrosanctity.

---

### Next Step

Begin the dedicated Hub admin dashboard decomposition session using the component breakdown above as the locked-in roadmap — starting with `AuthGate.tsx` + `HubShell.tsx` tab-switching shell, then `QueueTable.tsx`, then `InventoryManager.tsx`/`InvEditModal.tsx`. Root `main.cjs`/Electron build and both legacy `hub.html` files remain completely untouched throughout.

---

## Previous Entry — 2026-07-12 (Phase 3 — Request Page Vertical Slice — FINAL Phase 3 Public Page)


### Task: Port the legacy `request.html` multi-tenant print-job intake form to `web/src/app/(marketing)/request/page.tsx`

**Branch:** `feature/universal-web-target`
**Files Created/Modified:**
- `web/src/app/(marketing)/request/page.tsx` — replaced the Phase 2 placeholder stub with a full port
- `web/src/app/api/notify-discord/route.ts` — new server Route Handler for the Discord webhook notification

---

### Summary

Inspected legacy `request.html` first, per task scope (`hub.html`/`src/pages/admin/hub.html` were never opened, per the strict file ban). Confirmed the legacy page implements: a strict `?shop=` slug gate validated against the `shops` table (blank slug or no match → "Shop Not Found" error card, replacing the entire page body), shop branding injection (`shop_name`/`logo_url` into the header), a shop-scoped filament checklist (`colors` where `inStock=true` and `shop_slug` matches) with multi-select "pill" chips, form validation (name + project + ≥1 filament required), and a direct Supabase insert into `print_jobs` using the exact legacy payload shape, followed by a fire-and-forget Discord webhook notification.

Ported as a Client Component (`'use client'`), since the page is fully interactive (URL-param gate, live Supabase calls, form state):
- **Shop-slug gate:** `useSearchParams()` + a `useEffect` gate (`'checking' | 'not-found' | 'ok'` state) reproduces the legacy 3-step validation exactly — missing slug or no matching `shops` row renders the same "Shop Not Found" card copy, before any of the rest of the page mounts. Per Next.js App Router rules, `useSearchParams()` requires a `<Suspense>` boundary, so the exported `RequestPage` is a thin `<Suspense>` wrapper around the real `RequestPageInner` client-logic component.
- **Shop branding:** a second effect (gated on `gate === 'ok'`) fetches `shop_name`/`logo_url` and swaps the header between a rendered logo `<img>` or a text fallback, plus updates `document.title` — matching legacy behavior.
- **Filament checklist + pills:** rebuilt as React state (`allFilaments`, `selectedFilaments`) instead of raw DOM manipulation, with the same scoped Supabase query (`inStock=true` + `shop_slug`), the same checkbox-list/pill-chip UX, restyled with Tailwind v4 utility classes consistent with the rest of the ported marketing pages (matching `contact/page.tsx`'s styling conventions) rather than copying the legacy inline `<style>` block.
- **Validation + submit:** preserved 1:1 — requestor name + project name required, ≥1 filament color required, special-instructions text appended into `project_name` via the same `📝` separator convention, and the exact same `print_jobs` insert payload (`requestor_name, project_name, stl_url, filament_id, color_preference, status: 'Pending', shop_slug`) — no schema changes, satisfying Database Sacrosanctity.
- **Supabase client:** uses the shared browser client (`lib/supabase/client.ts`) instead of the retired CDN-script + `js/api/api.js` pattern.
- **Discord webhook — security hardening:** the legacy page read `window.DISCORD_WEBHOOK_URL` and POSTed to Discord directly from the browser — a client-exposed secret flagged in this log's Phase 1 "Flagged Findings" #1 alongside the retired `/api/env` leak. Closed that gap here: added a new server Route Handler `web/src/app/api/notify-discord/route.ts` that reads the server-only `DISCORD_WEBHOOK_URL` env var (already scaffolded in `.env.local.example`, never prefixed `NEXT_PUBLIC_`) and performs the actual Discord embed POST. The client component now does a fire-and-forget `fetch('/api/notify-discord', ...)` with just the job summary fields, never touching the webhook URL itself.

**Root-level files touched:** none. `hub.html` and `src/pages/admin/hub.html` were never opened, read, or referenced, per the strict file ban for this task.

---

### Verification
- `npm run build` inside `/web` — **passes clean**. Route table confirms `○ /request` compiles as a static prerendered route and `ƒ /api/notify-discord` compiles as a new dynamic server route, alongside all other existing routes (`/`, `/contact`, `/gallery`, `/hub`, `/inventory`, `/team`, `/api/keepalive`).

---

### Next Step

This closes out the Phase 3 public-page vertical-slice ports — all five legacy public pages (`/`, `/inventory`, `/gallery`, `/contact`, `/team`, `/request`) are now fully ported to the Next.js App Router. The remaining major effort is the dedicated Hub admin dashboard decomposition (QueueTable, InventoryManager, AuthGate + Supabase Auth/RLS per Phase 1 Part 3 Rule 2) — a separate, focused future session. Root `main.cjs`/Electron build and `hub.html` remain completely untouched throughout.

---

## Previous Entry — 2026-07-12 (Phase 3 — Team Page Vertical Slice)


### Task: Port the legacy `meettheteam.html` family bio grid to `web/src/app/(marketing)/team/page.tsx`

**Branch:** `feature/universal-web-target`
**Files Modified:**
- `web/src/app/(marketing)/team/page.tsx` — replaced the Phase 2 placeholder stub with a full port
- `web/public/images/{luis1,ellen,evan1,enrique3,ailey,jordiluis1}.jpg` — copied from the legacy root-level `public/images/` folder (new files, additive copy only)

---

### Summary

Inspected legacy `meettheteam.html` first, per task scope. Confirmed it's fully static markup: an intro section ("Behind the Prints: A Family Affair") followed by a `.team-grid` of six `.team-card` entries, each with an `<img class="avatar">`, a role heading, and a bio paragraph — no dynamic data source, no Supabase involvement.

Ported as a plain Server Component (no `'use client'` needed):
- Reused the existing `<Header activePath="/team" subtitle="A family legacy, one layer at a time." />` component, matching the pattern already established by Home/Gallery/Contact.
- Defined a local, typed `TEAM_MEMBERS: TeamMember[]` array (6 entries, 1:1 with the legacy cards) instead of a data-fetch layer, since these are static family bios with no backing table.
- Rendered a responsive Tailwind v4 grid (`grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`) of card components — rounded circular avatar via `next/image`, role heading, bio text — with hover-lift/shadow transitions, replacing the legacy `.team-card`/`.avatar` CSS rules from `styles/style.css` with equivalent utility classes.
- Copied the six avatar photos (`luis1.jpg`, `ellen.jpg`, `evan1.jpg`, `enrique3.jpg`, `ailey.jpg`, `jordiluis1.jpg`) from the legacy root `public/images/` into `web/public/images/` so `next/image` can resolve them locally within `/web`'s own public directory — original root-level files were left completely untouched (additive copy only).

**Root-level files touched:** none. `hub.html` and `src/pages/admin/hub.html` were never opened, read, or referenced, per the strict file ban for this task.

---

### Verification
- `npm run build` inside `/web` — **passes clean**. Route table confirms `○ /team` compiles as a static prerendered route alongside the other public pages (`/`, `/contact`, `/gallery`, `/hub`, `/inventory`, `/request`, `/api/keepalive`).

---

### Next Step

Continue the remaining Phase 3 public-page vertical-slice port in a follow-up session: Request (shop-slug gate) — the last remaining public marketing page. The Hub admin dashboard decomposition remains a separate, dedicated future effort. Root `main.cjs`/Electron build and `hub.html` remain completely untouched.

---

## Previous Entry — 2026-07-12 (Phase 3 — Contact Page Vertical Slice)


### Task: Port the legacy `contact.html` Web3Forms contact form to `web/src/app/(marketing)/contact/page.tsx`

**Branch:** `feature/universal-web-target`
**Files Modified:**
- `web/src/app/(marketing)/contact/page.tsx` — replaced the Phase 2 placeholder stub with a full port

---

### Summary

Inspected legacy `contact.html` first, per task scope. It's a static form POSTing directly to `https://api.web3forms.com/submit`, using a hardcoded `access_key`, `from_name`, `redirect`, and a `botcheck` honeypot checkbox, with a name/email/inquiry-type-select/message field set and an hCaptcha widget rendered via Web3Forms' own client script (`web3forms.com/client/script.js`).

Ported as a Client Component (`'use client'`) since the form now handles its own submit (AJAX `fetch` to Web3Forms' endpoint with inline success/error state) instead of the legacy hard `redirect` to `index.html`:
- Reused the existing `<Header activePath="/contact" subtitle="..." />` component and the shared `<Footer>` from the marketing layout — no duplication.
- Loaded the Web3Forms client script via `next/script` (`strategy="afterInteractive"`), replicating the legacy `<script async defer>` tag idiomatically for Next.js.
- Ported all fields 1:1: honeypot, hidden `access_key`/`from_name`, name (pattern-validated), email, inquiry-type `<select>` (identical options/emoji labels), message textarea (`maxLength`), and the `.h-captcha` div for Web3Forms' auto-injected hCaptcha widget.
- Styled with Tailwind v4 utility classes matching the site's existing palette (the `hsl(25,36%,37%)` accent used in `Header.tsx`), rounded inputs, focus rings, and a submit button with `disabled`/loading state plus inline success/error messaging.

**Root-level files touched:** none. `hub.html` and `src/pages/admin/hub.html` were never opened, read, or referenced, per the strict file ban for this task.

---

### Verification
- `npm run build` inside `/web` — **passes clean**. Route table confirms `○ /contact` compiles as a static prerendered route alongside the other public pages.

---

### Next Step

Continue the remaining Phase 3 public-page vertical-slice ports in follow-up sessions: Team (family bios) and Request (shop-slug gate) — one page per session, matching this task's scope discipline. The Hub admin dashboard decomposition remains a separate, dedicated future effort. Root `main.cjs`/Electron build and `hub.html` remain completely untouched.

---

## Previous Entry — 2026-07-12 (Phase 3 — Gallery Page Vertical Slice)


### Task: Port the legacy `gallery.html` static photo showcase to `web/src/app/(marketing)/gallery/page.tsx`

**Branch:** `feature/universal-web-target`
**Files Modified:**
- `web/src/app/(marketing)/gallery/page.tsx` — replaced the Phase 2 placeholder stub with a full port
- `web/public/gallery/Spool-Holder.jpg` — copied from the legacy root-level `gallery/Spool-Holder.jpg` asset (new file)

---

### Summary

Inspected legacy `gallery.html` and `js/inventory.js` first, per task scope. Confirmed `js/inventory.js` contains zero gallery-specific logic — the legacy gallery page is 100% static markup: a single hardcoded `.gallery-item` (`gallery/Spool-Holder.jpg`, caption "Mini Spool Holder") inside a `#gallery` div, no data fetch, no Supabase involvement.

Ported this as a plain Server Component (no `'use client'` needed — no interactivity):
- Reused the existing `<Header activePath="/gallery" subtitle="..." />` component, matching the pattern already established by Home/Inventory pages.
- Defined a local, typed `GALLERY_ITEMS: GalleryItem[]` array (currently one entry) instead of a data-fetch layer, since there is no backing Supabase table for gallery photos — keeps the port honest to the legacy source and easy to extend with more entries later.
- Rendered a responsive Tailwind v4 flex-wrap grid of `<figure>` cards (rounded border, `next/image` for optimized image delivery, hover lift transition), replacing the legacy `.gallery-item`/`.gallery-item img` CSS rules from `styles/style.css` with equivalent utility classes.
- Copied the one existing gallery photo asset into `web/public/gallery/` so `next/image` can resolve it locally within `/web`'s own public directory (no reach-back into the legacy root at runtime).

**Root-level files touched:** none. `hub.html` and `src/pages/admin/hub.html` were never opened, read, or referenced, per the strict file ban for this task.

---

### Verification
- `npm run build --prefix web` — **passes clean**. Route table confirms `○ /gallery` compiles as a static prerendered route alongside the other public pages (`/`, `/contact`, `/inventory`, `/request`, `/team`, `/hub`, `/api/keepalive`).

---

### Next Step

Continue the remaining Phase 3 public-page vertical-slice ports in follow-up sessions: Contact (Web3Forms), Team (family bios), and Request (shop-slug gate) — one page per session, matching this task's scope discipline. The Hub admin dashboard decomposition remains a separate, dedicated future effort. Root `main.cjs`/Electron build and `hub.html` remain completely untouched.

---

## Previous Entry — 2026-07-12 (Phase 2 — Next.js Monorepo Scaffold + Inventory Vertical Slice)


### Task: Scaffold `/web` Next.js 16 (App Router) + Tailwind v4 + Supabase monorepo, port Header/Footer/Tracker and fully port the public Inventory page as a vertical-slice proof of the migration pattern

**Branch:** `feature/universal-web-target`
**Files Created:** entire `web/` subdirectory (Next.js app created via `create-next-app` with TypeScript, Tailwind v4, App Router, `src/` dir, `@/*` import alias), plus:
- `web/src/lib/supabase/{client.ts,server.ts,queries.ts}` — browser/server Supabase clients (`@supabase/ssr`) + `getInStockColors()` data-access function
- `web/src/lib/analytics/track.ts` + `web/src/components/analytics/TrackerBeacon.tsx` — 1:1 port of `js/utils/tracker.js`'s `site_traffic` visit logging, mounted once in root layout
- `web/src/components/layout/{Header.tsx,Footer.tsx}` — shared nav/footer ported from the duplicated markup across all 5 legacy public pages + `js/utils/footer.js`
- `web/src/app/(marketing)/{layout.tsx,page.tsx,inventory/,gallery/,contact/,team/,request/}` — route group for all public pages; **Inventory is the fully-ported vertical slice** (Server Component fetch via `getInStockColors()` + Client Component `<InventoryGrid />` replicating `js/inventory.js`'s search/finish-filter/swatch-color logic exactly); Gallery/Contact/Team/Request are intentionally scoped as foundation stubs for a future pass
- `web/src/app/(dashboard)/hub/page.tsx` — placeholder stub only; the 2,689-line hub.html decomposition is explicitly deferred to its own dedicated session
- `web/src/app/api/keepalive/route.ts` + `web/vercel.json` `crons` entry — Keep-Alive Architecture implementation (Phase 1 Part 3 Rule 4), pings `colors` table on a schedule, no `functions`/`runtime` block
- `web/.env.local` / `web/.env.local.example` — `NEXT_PUBLIC_SUPABASE_URL`/`NEXT_PUBLIC_SUPABASE_ANON_KEY` (build-time, RLS-protected) + server-only `ADMIN_KEY`/`DISCORD_WEBHOOK_URL` placeholders, replacing the leaky `/api/env.js` pattern
- `web/next.config.ts` — pinned `turbopack.root` to the `/web` folder to resolve a workspace-root misdetection caused by the sibling root-level `package.json`/`package-lock.json` (legacy Electron app)

**Root-level files touched:** none. `package.json`/`package-lock.json` were transiently modified by an errant root-level `npm install` and immediately reverted via `git restore` — confirmed clean via `git diff`. All new dependencies (`@supabase/ssr`, `@supabase/supabase-js`) live exclusively in `web/package.json`, fully isolated from the legacy Electron root project per SCOPE ISOLATION.

---

### Verification
- `npm run build` inside `/web` — **passes clean**, all 9 routes compile (`/`, `/contact`, `/gallery`, `/hub`, `/inventory` (dynamic/ISR), `/request`, `/team`, `/api/keepalive`).
- `npm run dev` — started successfully; live-fetched `http://localhost:3000/inventory` and confirmed real Supabase `colors` rows (37 in-stock swatches, e.g. "Beige", "Matte Army Blue", "Dual Silk Caribbean Sea") render correctly with working search input, finish-filter pill buttons, and gradient/solid swatch styling — a faithful, working port of the legacy public inventory page, now served from the Next.js App Router with zero client-side round-trip to `/api/env`.
- No Supabase schema was modified — `getInStockColors()` reads `colors` via the exact existing column set (`id, color, finish, description, inStock, colorHex1, colorHex2, colorHex3, shop_slug`) confirmed in Phase 1's Database Sacrosanctity audit.

---

### Next Step

Continue vertical-slice ports of the remaining public stub pages (Gallery, Contact w/ Web3Forms, Team, Request w/ shop-slug gate) in a follow-up session, then begin the dedicated Hub admin dashboard decomposition (QueueTable, InventoryManager, AuthGate + Supabase Auth/RLS per Phase 1 Part 3 Rule 2) as its own focused effort. Root `main.cjs`/Electron build remains completely untouched throughout.

---

## Previous Entry — 2026-07-12 (Phase 1 Investigation — Next.js/Tailwind/Supabase Monorepo Transition)


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
