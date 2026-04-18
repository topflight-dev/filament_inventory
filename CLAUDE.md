# CLAUDE.md — Source of Truth
> **Crafted 3D Workshop | Filament Inventory Ecosystem**
> Last Audited: 2026-04-17 | Lead Developer: Claude (Sonnet 4.6)

---

## 🗂️ CURRENT PROJECT STRUCTURE

```
filament_inventory_site/               ← PROJECT ROOT (Desktop / Public Site)
│
├── index.html                         ← Home page (Our Story, Our Purpose, CTA)
├── inventory.html                     ← Public filament inventory display
├── gallery.html                       ← Printed products showcase
├── contact.html                       ← Web3Forms contact form
├── meettheteam.html                   ← Family team profiles
├── admin.html                         ← 🔒 Hidden admin portal (add/edit/delete filaments)
│
├── style.css                          ← SINGLE shared stylesheet for ALL root pages
│
├── js/
│   ├── footer.js                      ← Global footer injector + version tracker (v1.8.0)
│   ├── inventory.js                   ← Fetches & renders public inventory from API
│   ├── tracker.js                     ← Visit tracking (injected by footer.js)
│   ├── home.js                        ← Nav active-state helper (currently unused in index.html)
│   ├── contact.js                     ← Nav active-state helper (currently unused in contact.html)
│   ├── gallery.js                     ← ⚠️ EMPTY FILE (0 bytes) — stub only
│   └── meettheteam.js                 ← ⚠️ EMPTY FILE (0 bytes) — stub only
│
├── images/
│   ├── luis1.jpg, ellen.jpg, evan1.jpg, enrique3.jpg, ailey.jpg, jordiluis1.jpg
│   ├── placeholder.jpg                ← Used in home page "Our Purpose" section
│   ├── black.jpg, blue.jpg, cream.jpg, lime green.jpg, red.jpg
│   ├── Crafted 3D.png                 ← Brand logo
│   ├── icon.png                       ← PWA icon (referenced by mobile manifest)
│   └── Old Photos/                    ← Archive folder
│
├── gallery/
│   └── Spool-Holder.jpg               ← Only gallery image currently in use
│
├── Crafted 3D.ico                     ← Favicon used by ALL root HTML pages
├── icon.png                           ← Root-level icon (duplicate of images/icon.png)
│
├── server.js                          ← Express.js backend (hosted on Render.com)
├── package.json                       ← Node.js project config (ESM modules)
├── .env                               ← 🔒 Supabase credentials (gitignored)
├── .gitignore
├── CNAME                              ← Custom domain: crafted3dworkshop.com
├── README.md                          ← Architecture overview
├── Project_Log.md                     ← Development progress log
├── CLAUDE.md                          ← This file — Source of Truth
│
└── mobile-companion/                  ← MOBILE PWA — Admin Tool (Option C)
    ├── index.html                     ← ✅ Mobile Admin Tool (stats, inventory mgmt, add filament)
    ├── style.css                      ← ✅ Clean mobile-optimized stylesheet (no nesting bugs)
    ├── manifest.json                  ← PWA manifest (references ../icon.png)
    ├── Crafted 3D.ico                 ← ✅ Favicon (local copy)
    ├── images/
    │   ├── luis1.jpg                  ← ✅ Copied from root (available for future use)
    │   ├── ellen.jpg                  ← ✅ Copied from root
    │   ├── jordiluis1.jpg             ← ✅ Copied from root
    │   └── placeholder.jpg            ← ✅ Copied from root
    └── js/
        ├── footer.js                  ← ✅ Copied from root (global footer injector)
        └── tracker.js                 ← ✅ Copied from root (visit tracking)
```

---

## 🛠️ TECH STACK

| Layer | Technology | Notes |
|---|---|---|
| **Frontend** | HTML5, CSS3, Vanilla JavaScript | No frameworks |
| **Styling** | Single `style.css` per context | Google Fonts (Inter) via CDN |
| **Backend** | Node.js + Express.js (v5) | Hosted on Render.com |
| **Database** | Supabase (PostgreSQL) | Via `@supabase/supabase-js` v2 |
| **Security** | Helmet.js, CORS, API Key auth | `x-api-key` header for admin routes |
| **Contact Form** | Web3Forms | External service, no backend needed |
| **Visit Tracking** | Custom `/api/track-visit` endpoint | Writes to `site_traffic` Supabase table |
| **PWA** | `mobile-companion/manifest.json` | Standalone display mode |
| **Deployment** | GitHub → Render.com | `git push origin main` triggers deploy |
| **Domain** | crafted3dworkshop.com | CNAME configured |

### Supabase Tables
- **`colors`** — Filament inventory (color, finish, description, inStock, colorHex1/2/3)
- **`site_traffic`** — Visit analytics (page_path, user_agent, visit_time)

### API Endpoints (Base: `https://filament-inventory.onrender.com`)
| Method | Route | Auth | Purpose |
|---|---|---|---|
| GET | `/inventory` | Public | Fetch all filament records |
| POST | `/inventory` | Admin Key | Add new filament |
| PATCH | `/inventory/:id` | Admin Key | Update filament field |
| DELETE | `/inventory/:id` | Admin Key | Remove filament |
| POST | `/api/track-visit` | Public | Log page visit |
| GET | `/api/stats` | Admin Key | Get visit counts |

---

## ✅ CRITICAL PATH REPAIR — COMPLETED (2026-04-17)

### What Was Fixed

| Bug | Status | Resolution |
|---|---|---|
| `mobile-companion/index.html` — 6+ broken asset paths | ✅ FIXED | Completely rewritten as mobile admin tool; all paths now resolve correctly |
| `mobile-companion/style.css` — unclosed `@media` nesting bug | ✅ FIXED | Rewritten from scratch; brace check confirmed 65 open = 65 close |
| Missing `images/` folder in mobile-companion | ✅ FIXED | Created `mobile-companion/images/` with 4 required images |
| Missing `js/` folder in mobile-companion | ✅ FIXED | Created `mobile-companion/js/` with `footer.js` and `tracker.js` |
| Missing favicon in mobile-companion | ✅ FIXED | `Crafted 3D.ico` copied to `mobile-companion/` |
| Broken nav links (relative paths to non-existent pages) | ✅ FIXED | Nav now links to absolute URLs on `crafted3dworkshop.com` |

### Mobile Companion — New Functionality (Option C: Admin Tool)
The `mobile-companion/index.html` is now a **purpose-built mobile admin tool** with:
- **📊 Stats Panel** — Today's visits, total visits, colors in stock (live from API)
- **🎨 Inventory Manager** — Search, sync, toggle in/out of stock, edit name/finish, delete
- **➕ Add Filament** — Full form with color picker sync, finish dropdown, duplicate detection
- **Toast notifications** — Non-blocking feedback for all actions
- **Edit Modal** — Inline field editing without page reload
- **Optimistic UI** — Stock toggles update instantly with localStorage pending state

---

## 📋 REMAINING KNOWN BUGS (Non-Critical)

| Priority | File | Issue |
|---|---|---|
| 🟡 MEDIUM | `style.css` line 148 | CSS typo: `border-top: 1 =px solid #ddd;` |
| 🟡 MEDIUM | `style.css` line 86 | Typo: `font-family: 'Inter', sas-serif;` |
| 🟡 MEDIUM | `admin.html` | Admin API key hardcoded in client-side JS |
| 🟢 LOW | `js/gallery.js` | Empty file (0 bytes) — stub only |
| 🟢 LOW | `js/meettheteam.js` | Empty file (0 bytes) — stub only |
| 🟢 LOW | `js/home.js` | Not referenced in `index.html` |
| 🟢 LOW | `js/contact.js` | Not referenced in `contact.html` |
| 🟢 LOW | `package.json` | `airtable` dependency is a legacy leftover |

---

*This document is the Source of Truth for the Crafted 3D Workshop project. Update after every significant task.*
