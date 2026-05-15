## Project Log

---

### 2026-05-14 — Fix: Moved Assets into Public Directory to Resolve Render Pathing Errors (Cline)

**Task Completed:** Moved `src/styles/` and `src/js/` into `src/pages/public/` so that Render serves them correctly relative to the HTML files. Updated all HTML asset paths accordingly.

**Files Moved:**
- `src/styles/` → `src/pages/public/styles/` (contains `style.css`)
- `src/js/` → `src/pages/public/js/` (contains `inventory.js`, `api/api.js`, `utils/footer.js`, `utils/tracker.js`)

**HTML Files Updated (removed `../../` prefix from all local asset paths):**
- `src/pages/public/request.html` — `styles/style.css`, `js/api/api.js`, `js/utils/footer.js`
- `src/pages/public/index.html` — `styles/style.css?v=1.1.7`, `js/utils/footer.js`
- `src/pages/public/inventory.html` — `styles/style.css`, `js/api/api.js`, `js/inventory.js`, `js/utils/footer.js`
- `src/pages/public/gallery.html` — `styles/style.css`, `js/utils/footer.js`
- `src/pages/public/contact.html` — `styles/style.css`, `js/utils/footer.js`
- `src/pages/public/meettheteam.html` — `styles/style.css`, `js/utils/footer.js`

**Commit:** `beccc3a` — `Fix: Moved assets into public directory to resolve Render pathing errors`

**Remote:** `https://github.com/blast1221/filament_inventory.git` → `main`

**Status:** Deployed to production ✅

**Next Step:**
- Verify live site on Render to confirm CSS and JS assets load correctly (no more raw HTML rendering)


---

### 2026-05-14 — Git Push: request.html Styling Fix Deployed (Cline)

**Task Completed:** Staged, committed, and pushed the container/glass-panel styling fix for `src/pages/public/request.html` to the production `main` branch on GitHub.

**Commit:** `f5c46af` — `Fix: Applied container and glass-panel styling to request form`

**Remote:** `https://github.com/blast1221/filament_inventory.git` → `main`

**Files Pushed:**
- `src/pages/public/request.html` — 3 insertions, 1 deletion (container wrapper + btn classes)

**Status:** Deployed to production ✅

**Next Step:**
- Verify visual rendering of `request.html` in the live production environment to confirm the glass-panel theme is applied correctly

---

### 2026-05-14 — request.html: Visual Theme Structural Repair (Cline)

**Task Completed:** Applied CSS class wrapper fix to `src/pages/public/request.html` to restore the site's visual theme. The `.glass-panel` styles were being ignored because the required outer `.container` div was missing, and the submit button lacked the global `btn btn-primary` classes.

**Files Modified:**
- `src/pages/public/request.html` — Two targeted structural changes:
  1. **Added `<div class="container">` wrapper** around the existing `<div class="glass-panel">` inside `<main>`, creating the required `container > glass-panel` double-nested structure.
  2. **Updated submit button** from `class="submit-btn"` to `class="submit-btn btn btn-primary"` to apply global theme button styles.

**Verification:**
- ✅ All existing IDs preserved: `#filamentSelect`, `#requestForm`, `#statusMessage`, `#submitBtn`
- ✅ All JavaScript logic (filament fetch, form submission, status display) completely untouched
- ✅ Structure: `<main> > <div class="container"> > <div class="glass-panel"> > <form id="requestForm">`
- ✅ Button: `class="submit-btn btn btn-primary"`

**Next Step:**
- Verify visual rendering of `request.html` in the browser to confirm theme is applied correctly


---

### 2026-05-14 — Print Queue Hub Page Created (Cline)

**Task Completed:** Created `src/pages/admin/hub.html` — a dedicated, dark-mode Print Queue Hub designed for use at the printer station.

**Files Created:**
- `src/pages/admin/hub.html` — New standalone admin hub page with:
  - **Dark Mode Theme:** `body` background `#1a1a1a`, text `#ffffff`; full dark overrides for `header`, `nav`, `footer` from `style.css`
  - **Head:** `<link rel="stylesheet" href="../../styles/style.css">` and `<script src="../../js/api/api.js"></script>` (exposes `window.PRINT_QUEUE_BASE` and `window.ADMIN_KEY`)
  - **Top Control Bar:** Yellow `⏳ Pending: N` badge counter, `🔄 Manual Refresh` button, `⚫/🟢 Auto-Refresh: OFF/ON` toggle button
  - **Full-Width Table:** Columns — Child Name, Project, Filament, Status Badge, Action; `width: 100%` with no max-width constraint
  - **Oversized Action Buttons:** `min-width: 210px`, `font-size: 1.1rem`, `padding: 16px 24px` — readable from across the room
  - **Status Badges:** Yellow (Pending), Blue (Printing), Green (Completed)
  - **`fetchQueue()`:** GETs from `window.PRINT_QUEUE_BASE` with cache-bust on `DOMContentLoaded`
  - **`cycleStatus(id, currentStatus, btn)`:** Cycles `pending → printing → completed → pending` via `PATCH ${window.PRINT_QUEUE_BASE}/${id}` with `x-admin-key: window.ADMIN_KEY`; updates row in-place without full re-fetch
  - **`toggleAutoRefresh()`:** `setInterval` / `clearInterval` at 60-second interval; button reflects ON/OFF state
  - **Empty/Error states:** Graceful messaging for empty queue and network failures
  - **Toast notifications** for status updates and auto-refresh toggle
  - **Bottom footer link:** `← Back to Admin Panel (Inventory Management)` → `./admin.html`

**Verification:**
- ✅ File created at `C:\Projects\filament_inventory_site\src\pages\admin\hub.html`
- ✅ Correct relative paths for `src/pages/admin/` location (2 levels deep)
- ✅ `api.js` loaded in `<head>` so `window.PRINT_QUEUE_BASE` and `window.ADMIN_KEY` available to inline script
- ✅ PATCH uses `x-admin-key` header (matching server.js auth check)
- ✅ Action button labels cycle contextually: `▶ Start Printing` → `✅ Mark Complete` → `🔄 Reset to Pending`
- ✅ Pending count updates live after each status change

**Next Step:**
- Add a nav link to `hub.html` from `admin.html` for easy navigation between the two admin tools


---

### 2026-05-14 — Public Nav Audit: request.html Visibility Check (Cline)

**Task Completed:** Performed a search-and-remove audit across all 5 public-facing HTML files to ensure zero public visibility of the `request.html` print request feature.

**Files Scanned:**
- `src/pages/public/index.html`
- `src/pages/public/inventory.html`
- `src/pages/public/gallery.html`
- `src/pages/public/contact.html`
- `src/pages/public/meettheteam.html`

**Action:** Scanned all `<nav>` and `<footer>` sections for any `<li>` or `<a>` tags referencing `request.html`.

**Result:** No references found in any file. All 5 pages are clean — `request.html` has zero public visibility and is not linked from any public-facing navigation or footer.

**Files Modified:** None (no changes required).

**Next Step:**
- Build the `print_jobs` table in Supabase with columns: `id`, `requestor_name`, `project_name`, `stl_url`, `filament_id`, `color_preference`, `status`, `created_at`

---

### 2026-05-14 — Print Queue Admin Section Added (Cline)

**Task Completed:** Added a "🖨️ Pending Print Jobs" section to `src/pages/admin/admin.html`, below the existing Manage Inventory panel.

**Files Modified:**
- `src/pages/admin/admin.html` — Added:
  - **CSS:** `.print-queue-table`, `.pq-status-badge` (with `.pq-status-pending`, `.pq-status-printing`, `.pq-status-completed` color variants), and `.pq-update-btn` styles
  - **HTML:** New `<section class="glass-panel">` with `id="printQueueResults"` and a "🔄 Refresh Queue" button
  - **JS:** `fetchPrintQueue()` — GETs from `window.PRINT_QUEUE_BASE` with cache-bust; `renderPrintQueue(jobs)` — builds a 5-column table (Requestor, Project, Filament Choice, Status, Action); `cycleStatus(id, currentStatus, btn)` — cycles `Pending → Printing → Completed → Pending` via PATCH to `${window.PRINT_QUEUE_BASE}/${id}` with `x-admin-key: window.ADMIN_KEY` header
  - `pqRefreshBtn` event listener wired up
  - `fetchPrintQueue()` called in `DOMContentLoaded` init sequence

**Verification:**
- ✅ Section placed below Manage Inventory, above version footer
- ✅ PATCH request uses `x-admin-key` header with `window.ADMIN_KEY`
- ✅ Status badge colors: yellow (Pending), blue (Printing), green (Completed)
- ✅ Button label updates contextually per current status
- ✅ Graceful error handling if queue endpoint is unreachable

**Next Step:**
- Create the `print_jobs` table in Supabase with columns: `id`, `requestor_name`, `project_name`, `stl_url`, `filament_id`, `color_preference`, `status`, `created_at`
- Add a nav link to `request.html` in the other public pages if desired

---

### 2026-05-14 — Print Request Page Created (Cline)

**Task Completed:** Created `src/pages/public/request.html` — a public-facing print request form that lets users select a filament from live inventory and submit a print job to the queue.

**Files Created:**
- `src/pages/public/request.html` — New public page with:
  - Inline `.glass-panel` CSS (matching `admin.html` pattern) — frosted glass card container
  - Filament `<select id="filamentSelect">` dropdown populated on `DOMContentLoaded` via `fetch(window.API_BASE)` — only in-stock filaments shown; option text = `"${color} — ${finish}"`, value = `id`
  - Inputs for: Requestor Name (required), Project Name (required), Link to Model (optional)
  - `POST` submission to `window.PRINT_QUEUE_BASE` with payload: `{ requestor_name, project_name, stl_url, filament_id }`
  - Submit button with loading state (disabled + text change to "Submitting..." during fetch)
  - Inline success (green `#d1fae5`) and error (red `#fee2e2`) `#statusMessage` display
  - Form reset on successful submission
  - Nav includes "Print Request" link with `.active` class
  - Correct relative paths: `../../styles/style.css`, `../../js/api/api.js`, `../../js/utils/footer.js`, `../../../Crafted 3D.ico`

**Verification:**
- ✅ File created at `C:\Projects\filament_inventory_site\src\pages\public\request.html`
- ✅ All relative paths verified against `src/pages/public/` (3 levels deep) location
- ✅ `api.js` loaded in `<head>` so `window.API_BASE` and `window.PRINT_QUEUE_BASE` are available to inline script
- ✅ `footer.js` loaded at bottom of `<body>`
- ✅ Payload fields match backend: `requestor_name`, `project_name`, `stl_url`, `filament_id`
- ✅ Glass panel style consistent with `admin.html` design language

**Next Step:**
- Add a nav link to `request.html` in the other public pages (`index.html`, `inventory.html`, etc.) if desired
- Create the `print_jobs` table in Supabase with columns: `id`, `requestor_name`, `project_name`, `stl_url`, `filament_id`, `color_preference`, `status`, `created_at`

---

### 2026-05-14 — 3D Print Queue: Backend Routing & API Config (Cline)

**Task Completed:** Implemented backend routing and frontend API configuration for the new 3D Print Queue feature.

**Files Modified:**

- `src/js/api/api.js` — Appended `PRINT_QUEUE_BASE` constant (`https://filament-inventory.onrender.com/print-queue`) and exposed it on `window.PRINT_QUEUE_BASE` for use by inline scripts.
- `server.js` — Inserted three new Express route handlers immediately after the existing `/inventory` CRUD routes:
  - `GET /print-queue` — Public read; fetches all print jobs from `print_jobs` table ordered by `created_at` ascending.
  - `POST /print-queue` — Public write; inserts a new print job with fields: `requestor_name`, `project_name`, `stl_url`, `filament_id`, `color_preference`.
  - `PATCH /print-queue/:id` — Admin-only; updates `status` field on a job, authenticated via `x-admin-key` request header.
- `server.js` (CORS) — Added `'x-admin-key'` to the `allowedHeaders` array so browser preflight requests for the PATCH route are not blocked.

**Verification:**
- ✅ `node --check server.js` — No syntax errors
- ✅ All three routes inserted after `DELETE /inventory/:id` and before `POST /api/track-visit`
- ✅ `window.PRINT_QUEUE_BASE` available globally in frontend

**Next Step:**
- Build the frontend Print Queue UI page (`src/pages/public/print-queue.html`) that consumes `window.PRINT_QUEUE_BASE`
- Create the `print_jobs` table in Supabase with columns: `id`, `requestor_name`, `project_name`, `stl_url`, `filament_id`, `color_preference`, `status`, `created_at`


---

### 2026-05-11 — Step 2: Physical Reorganization (Cline)

**Task Completed:** Full directory restructure. All source files moved to organized subdirectories. `mobile-companion/` deleted. All relative paths updated.

**New Directory Structure:**
```
/src/pages/public/   → index.html, inventory.html, gallery.html, contact.html, meettheteam.html
/src/pages/admin/    → admin.html (single source for desktop + mobile PWA)
/src/styles/         → style.css
/src/js/api/         → api.js
/src/js/utils/       → footer.js, tracker.js
/src/js/             → inventory.js
/public/images/      → all images (moved from /images/)
```

**Files Moved:**
- `index.html` → `src/pages/public/index.html`
- `inventory.html` → `src/pages/public/inventory.html`
- `gallery.html` → `src/pages/public/gallery.html`
- `contact.html` → `src/pages/public/contact.html`
- `meettheteam.html` → `src/pages/public/meettheteam.html`
- `admin.html` → `src/pages/admin/admin.html`
- `style.css` → `src/styles/style.css`
- `js/api.js` → `src/js/api/api.js`
- `js/footer.js` → `src/js/utils/footer.js`
- `js/tracker.js` → `src/js/utils/tracker.js`
- `js/inventory.js` → `src/js/inventory.js`
- `images/*` → `public/images/*`

**Paths Updated (per file):**
- `src/pages/public/index.html` — style: `../../styles/style.css`, icon: `../../../Crafted 3D.ico`, manifest: `../../../manifest.json`, images: `../../../public/images/`, footer: `../../js/utils/footer.js`
- `src/pages/public/inventory.html` — style: `../../styles/style.css`, icon: `../../../Crafted 3D.ico`, scripts: `../../js/api/api.js`, `../../js/inventory.js`, `../../js/utils/footer.js`
- `src/pages/public/gallery.html` — style: `../../styles/style.css`, icon: `../../../Crafted 3D.ico`, gallery img: `../../../gallery/Spool-Holder.jpg`, footer: `../../js/utils/footer.js`
- `src/pages/public/contact.html` — style: `../../styles/style.css`, icon: `../../../Crafted 3D.ico`, footer: `../../js/utils/footer.js`
- `src/pages/public/meettheteam.html` — style: `../../styles/style.css`, icon: `../../../Crafted 3D.ico`, images: `../../../public/images/`, footer: `../../js/utils/footer.js`
- `src/pages/admin/admin.html` — style: `../../styles/style.css`, icon: `../../../Crafted 3D.ico`, manifest: `../../../manifest.json`, api: `../../js/api/api.js`, footer: `../../js/utils/footer.js`
- `src/js/utils/footer.js` — tracker path updated to `../../js/utils/tracker.js`

**Deleted:**
- `mobile-companion/` — entire folder removed. `src/pages/admin/admin.html` is now the single source for both desktop and mobile PWA.

**Preserved (root-level, untouched):**
- `manifest.json` — root manifest preserved
- `CNAME` — root CNAME preserved
- `Crafted 3D.ico` — root favicon preserved

**Verification:**
- ✅ `mobile-companion/` confirmed deleted
- ✅ All 6 HTML files updated with correct relative paths
- ✅ `footer.js` tracker injection path updated
- ✅ `manifest.json` and `CNAME` untouched at root

### Next Step:
- Step 3: Update `server.js` and any deployment config to serve from the new `src/pages/public/` entry point
- Consider adding a root-level redirect `index.html` that points to `src/pages/public/index.html` for GitHub Pages compatibility

---

### 2026-05-11 — Step 1: Logic Consolidation (Cline)

**Task Completed:** API Gateway created, CSS typos fixed, orphaned JS files pruned.

**Files Created:**
- `js/api.js` — New API Gateway file. Contains `API_BASE` and `ADMIN_KEY` as the single source of truth for all backend communication. Exposes both on `window` for use by inline scripts.

**Files Modified:**
- `admin.html` — Removed hardcoded `API_BASE` and `ADMIN_KEY` constants from inline `<script>`. Added `<script src="./js/api.js"></script>` before the main script block.
- `mobile-companion/admin.html` — Same refactor; uses `<script src="../js/api.js"></script>` (correct relative path for subdirectory).
- `inventory.html` — Added `<script src="js/api.js"></script>` before `inventory.js` so `window.API_BASE` is available.
- `js/inventory.js` — Updated `fetch()` call to use `window.API_BASE || "https://filament-inventory.onrender.com/inventory"` (fallback preserves backward compatibility).
- `style.css` — Fixed two long-standing CSS typos:
  - Line 86: `sas-serif` → `sans-serif` (`.contact-intro` font-family)
  - Line 148: `1 =px` → `1px` (`footer` border-top)

**Files Deleted (Orphaned/Empty Stubs):**
- `js/home.js` — Nav active-state helper; not referenced in any HTML file
- `js/contact.js` — Nav active-state helper; not referenced in any HTML file
- `js/gallery.js` — Empty stub (0 bytes)
- `js/meettheteam.js` — Empty stub (0 bytes)

**Verification:**
- ✅ `js/` directory now contains only: `api.js`, `footer.js`, `inventory.js`, `tracker.js`
- ✅ No HTML files referenced the deleted JS files (confirmed via search before deletion)
- ✅ Both admin tools (`admin.html` and `mobile-companion/admin.html`) now load `API_BASE` and `ADMIN_KEY` from `js/api.js`
- ✅ `inventory.js` uses `window.API_BASE` with a safe fallback — no breaking change

---

### 2026-04-19 — v1.1.8: Ghost Dropdown Arrow Fix

**Task Completed:** Suppressed ghost dropdown/calendar picker arrows that appeared in the Color text field on some mobile browsers (Chrome Android, Samsung Internet).

**Files Modified:**
- `mobile-companion/admin.html` — CSS block added; version bumped to v1.1.8

**Changes Applied:**

1. **CSS Injection — Suppress Browser Decorations**
   - Added new `/* SUPPRESS GHOST DROPDOWN / SEARCH DECORATIONS */` block to the inline `<style>` section (placed before the `@media` responsive block):
     ```css
     input::-webkit-calendar-picker-indicator,
     input::-webkit-list-button,
     input::-webkit-inner-spin-button,
     input::-webkit-clear-button {
       display: none !important;
       -webkit-appearance: none !important;
       margin: 0;
     }
     ```
   - Targets all four WebKit pseudo-elements responsible for ghost UI decorations on `<input>` elements with `list` attributes or type-specific controls

2. **Version Bump — v1.1.8**
   - `style.css?v=1.1.7` → `style.css?v=1.1.8`
   - `manifest.json?v=1.1.7` → `manifest.json?v=1.1.8`
   - `../js/footer.js?v=1.1.7` → `../js/footer.js?v=1.1.8`
   - Footer text: `© 2026 | v1.1.7` → `© 2026 | v1.1.8`

**Commit:** `3b1605d` — `fix: remove ghost dropdown arrows and v1.1.8 bump`

**Remote:** `https://github.com/blast1221/filament_inventory.git` → `main`

**Status:** v1.1.8 Deployed ✅

---

### 2026-04-19 — v1.1.7: Maskable Icon & Cache Bust

**Task Completed:** Android icon safe-zone fix, manifest updated to maskable, all asset links cache-busted to v1.1.7.

**Files Modified:**
- `mobile-companion/manifest.json` — Icon `sizes` updated to `600x600`; `"purpose": "maskable"` added
- `index.html` — `style.css` bumped to `?v=1.1.7`; `<link rel="manifest" href="manifest.json?v=1.1.7">` added to `<head>`
- `mobile-companion/admin.html` — `style.css`, `manifest.json`, and `footer.js` links bumped to `?v=1.1.7`; footer text updated to `© 2026 | v1.1.7`
- `js/footer.js` — `currentVersion` updated from `"1.8.0"` → `"1.1.7"`

**Image Audit — icon.png:**
- ⚠️ EDGE BLEED DETECTED: `icon.png` is 600×600 but content touches the edges of the canvas.
- For a maskable icon, Android requires a safe zone of ~10% padding on all sides (approx. 60px inset).
- **Image was not edited per task constraints.** Manual action required: re-export `icon.png` with content confined to the inner 480×480 safe zone area.

**Commit:** `v1.1.7: maskable icon and cache bust`

**Remote:** `https://github.com/blast1221/filament_inventory.git` → `main`

---

### 2026-04-18 — v1.1.6: Single Footer & Persistence Active

**Task Completed:** Double footer resolved and section collapse persistence implemented in `mobile-companion/admin.html`.

**Files Modified:**
- `mobile-companion/admin.html` — Footer fix, localStorage persistence, version bump to v1.1.6

**Changes Applied:**

1. **Double Footer Fix**
   - Root cause: `../js/footer.js` injects a global `<footer>` via `insertAdjacentHTML('beforeend', ...)` on `DOMContentLoaded`
   - Strategy: Removed the manual `<footer>` element that was previously hardcoded inside `<main>`
   - Added a `MutationObserver` script (runs before `footer.js` loads) that watches `document.body` for new child nodes
   - When the global footer is injected (detected by `C3DW` or `Last Updated` text), the observer immediately hijacks it: strips its inline styles and replaces its content with `© 2026 | v1.1.6`
   - Observer disconnects after first match — zero performance overhead

2. **Section Collapse Persistence (localStorage)**
   - `toggleGroup()` now saves collapse state to `localStorage` key `adminCollapsedGroups` as a JSON object: `{ "group-matte": true, "group-silk": false, ... }`
   - New `restoreCollapsedState()` function reads this key on load and re-applies `.collapsed` class to any groups the user previously closed
   - Called in `DOMContentLoaded` init sequence, after `fetchForAdmin()` renders the groups
   - Debug `console.log` statements removed from `toggleGroup()` (cleanup)

3. **Versioning**
   - `style.css?v=1.1.5` → `style.css?v=1.1.6`
   - `../js/footer.js?v=1.1.5` → `../js/footer.js?v=1.1.6`
   - Footer text: `© 2026 | v1.1.6`

**Commit:** `3108be8` — `v1.1.6: Resolved double footer and added section persistence`

**Remote:** `https://github.com/blast1221/filament_inventory.git` → `main`

**Status:** v1.1.6 - Single Footer & Persistence Active ✅

---

### 2026-04-18 — Mobile Touch Interface Restored

**Task Completed:** Comprehensive mobile touch accessibility fix applied to `mobile-companion/admin.html`. Trashcan, Edit buttons, and section collapsing were all non-functional on touch devices.

**Files Modified:**
- `mobile-companion/admin.html` — CSS touch targets + JS event delegation overhaul

---

### 2026-04-18 — v1.1.5: Footer, Cache Busting & Touch Finalization

**Task Completed:** Final polish pass on `mobile-companion/admin.html`. Professional copyright footer added, cache-busting applied to all local assets, and touch event architecture finalized.

**Commit:** `465e9b9` — `v1.1.5: Added copyright footer with cache busting and finalized touch controls`

**Remote:** `https://github.com/blast1221/filament_inventory.git` → `main`

**Status:** v1.1.5 Finalized and Deployed ✅

---

### 2026-04-18 — Mobile Functionality Fix: Touch Events & State Sync

**Task Completed:** High-priority functional fix applied to `mobile-companion/admin.html`. Previous inline `onclick` approach was failing on mobile touch devices.

**Commit:** `16c896f` — `fix: mobile touch events and state sync`

**Remote:** `https://github.com/blast1221/filament_inventory.git` → `main`

**Status:** Mobile Functionality Verified

---

### 2026-04-18 — Dynamic Workshop Suite Finalized

**Task Completed:** Full Dynamic Collapsible Master Build applied to both `admin.html` (root) and `mobile-companion/admin.html`.

---

### 2026-04-18 — Global Admin Sync: Root admin.html Replaced

**Task Completed:** Root `admin.html` was outdated (legacy inline-CSS version). Replaced with the clean, modern `mobile-companion/admin.html` and corrected all relative paths for root-level serving.

**Commit:** `8b28d24` — `feat: sync mobile admin tool to root`

**Remote:** `https://github.com/blast1221/filament_inventory.git` → `main`

---

### 2026-04-18 — Stealth Admin Rename & PWA Sync

**Task Completed:** Renamed mobile admin entry point from `index.html` to `admin.html` for stealth deployment. PWA manifest updated to match.

**Commit:** `50b85b5` — `feat: stealth admin rename and pwa sync`

**Remote:** `https://github.com/blast1221/filament_inventory.git` → `main`

**Status:** Stealth App Ready

---

### 2026-04-17 — Critical Path Repair: Mobile Companion Synchronized (Claude Sonnet 4.6)

**Task Completed:** Mobile companion rebuilt as a self-contained mobile admin tool (Option C). All critical bugs cleared.

**Commit:** `3854d87` — `feat: implement mobile-optimized admin tool v1.8.1`

**Remote:** `https://github.com/blast1221/filament_inventory.git` → `main`

---

### 2026-04-17 — Clean House Audit (Claude Sonnet 4.6)

**Task Completed:** Full discovery audit of the project. Created `CLAUDE.md` as the Source of Truth.
