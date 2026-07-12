# C3DW Workshop — Project Log

## Latest Entry — 2026-07-12 (Request Queue Hover Dropdown)

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
