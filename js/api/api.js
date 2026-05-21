/**
 * api.js — API Gateway
 * Central configuration for all Supabase/backend communication.
 * Import this file in any page that needs to talk to the API.
 *
 * Environment Detection:
 *   - Electron desktop app loads via file: protocol → routes to PRODUCTION Render backend
 *     (Electron has no local server running; the .exe is a standalone viewer)
 *     Secrets (ADMIN_KEY, DISCORD_WEBHOOK_URL) are injected by main.cjs via
 *     executeJavaScript() before this script runs — no fetch needed.
 *   - Local dev server (localhost / 127.0.0.1) → routes to localhost:3000
 *   - Any live domain (Render, Vercel, etc.) → routes to production Render backend
 *     Secrets are fetched from /api/env (Vercel serverless function) on page load.
 *
 * Usage (in a <script> tag or module):
 *   <script src="./js/api/api.js"></script>
 *   Then use: window.API_BASE, window.PRINT_QUEUE_BASE, window.ADMIN_KEY,
 *             window.DISCORD_WEBHOOK_URL
 *
 * SECURITY NOTE:
 *   ADMIN_KEY and DISCORD_WEBHOOK_URL are NO LONGER hardcoded here.
 *   They are loaded at runtime from environment-specific sources:
 *     • Electron:  injected by main.cjs via win.webContents.executeJavaScript()
 *     • Vercel:    fetched from /api/env (reads Vercel Dashboard env vars)
 *   Add secrets to: Vercel Dashboard → Project → Settings → Environment Variables
 */

// Detect if running inside a local dev server (localhost / 127.0.0.1 only)
// NOTE: file:// protocol (Electron .exe) intentionally routes to PRODUCTION —
// the compiled desktop app has no local server; it connects directly to Render.
const isLocalDev = (
  window.location.hostname === 'localhost' ||
  window.location.hostname === '127.0.0.1'
);

// Switch base URL based on environment
const _BASE = isLocalDev
  ? 'http://localhost:3000'
  : 'https://filament-inventory.onrender.com';

// Expose on window so inline scripts in HTML files can access them
window.API_BASE         = _BASE + '/inventory';
window.PRINT_QUEUE_BASE = _BASE + '/print-queue';

// Supabase public credentials — safe to expose in frontend (anon key, RLS-protected)
window.SUPABASE_URL      = 'https://oyusccplccayyltmfdup.supabase.co';
window.SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im95dXNjY3BsY2NheXlsdG1mZHVwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcwODUxMDksImV4cCI6MjA4MjY2MTEwOX0.Wj7j8_bFwZOlJBcfReTdMJr7GdjqrmZIXhv9TIJA3ZA';

// ─────────────────────────────────────────────────────────────────────────────
// SECURE SECRET INITIALIZATION
// ─────────────────────────────────────────────────────────────────────────────
// Initialize to null — will be populated by one of two paths below:
//   1. Electron: main.cjs injects values via executeJavaScript() after load
//   2. Web/Vercel: fetched from /api/env serverless endpoint below
window.ADMIN_KEY           = window.ADMIN_KEY           || null;
window.DISCORD_WEBHOOK_URL = window.DISCORD_WEBHOOK_URL || null;

// Web/Vercel path: fetch secrets from the serverless config endpoint.
// Skipped entirely on Electron (file: protocol) — main.cjs handles injection there.
if (window.location.protocol !== 'file:') {
  fetch('/api/env')
    .then(res => {
      if (!res.ok) throw new Error(`/api/env returned ${res.status}`);
      return res.json();
    })
    .then(config => {
      if (config.ADMIN_KEY)           window.ADMIN_KEY           = config.ADMIN_KEY;
      if (config.DISCORD_WEBHOOK_URL) window.DISCORD_WEBHOOK_URL = config.DISCORD_WEBHOOK_URL;
      console.log('[C3DW Config] ✅ Runtime environment loaded from /api/env');
    })
    .catch(err => {
      // Non-fatal — app continues to function; admin features requiring the key
      // will fail gracefully. Check Vercel Dashboard env var configuration.
      console.warn('[C3DW Config] ⚠️ Could not load /api/env config:', err.message);
    });
}
