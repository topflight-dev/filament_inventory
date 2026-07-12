/**
 * api.js — Unified Cloud API Gateway
 * ─────────────────────────────────────────────────────────────────────────────
 * Cloud-native web/PWA target. All data operations go directly through the
 * Supabase client SDK — no Express proxy, no Render backend, no localhost
 * fallback required.
 *
 * Exposes on window:
 *   window.SUPABASE_URL        — Supabase project URL (safe to expose, anon key)
 *   window.SUPABASE_ANON_KEY   — Supabase anon key (RLS-protected)
 *   window.supabaseClient      — Initialized Supabase JS client (shared instance)
 *   window.ADMIN_KEY           — Runtime-injected admin key (from /api/env or Electron)
 *   window.DISCORD_WEBHOOK_URL — Runtime-injected webhook URL (from /api/env or Electron)
 *
 * Secret Injection Paths:
 *   • Electron (file://): main.cjs injects ADMIN_KEY + DISCORD_WEBHOOK_URL via
 *     win.webContents.executeJavaScript() before this script runs.
 *   • Web / Vercel (https://): fetched from /api/env serverless function on load.
 *
 * SECURITY NOTE:
 *   The Supabase anon key is safe to expose in frontend code. Row Level Security
 *   (RLS) on Supabase is the true data security layer. ADMIN_KEY is a UI-level
 *   gate only — it is never used as a Supabase service role key.
 * ─────────────────────────────────────────────────────────────────────────────
 */

// ─────────────────────────────────────────────────────────────────────────────
// SUPABASE PUBLIC CREDENTIALS
// Safe to expose in frontend (anon key, RLS-protected)
// ─────────────────────────────────────────────────────────────────────────────
window.SUPABASE_URL      = 'https://oyusccplccayyltmfdup.supabase.co';
window.SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im95dXNjY3BsY2NheXlsdG1mZHVwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcwODUxMDksImV4cCI6MjA4MjY2MTEwOX0.Wj7j8_bFwZOlJBcfReTdMJr7GdjqrmZIXhv9TIJA3ZA';

// ─────────────────────────────────────────────────────────────────────────────
// SHARED SUPABASE CLIENT INSTANCE
// Initialized once here; all pages reference window.supabaseClient directly.
// Requires the Supabase JS SDK to be loaded before this script runs:
//   <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js"></script>
//   <script src="js/api/api.js"></script>
// ─────────────────────────────────────────────────────────────────────────────
if (typeof supabase !== 'undefined') {
  window.supabaseClient = supabase.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY);
  console.log('[C3DW API] ✅ Supabase client initialized');
} else {
  // Deferred init — SDK may load after this script on some pages.
  // Use window.getSupabaseClient() for guaranteed lazy initialization.
  console.warn('[C3DW API] ⚠️ Supabase SDK not yet loaded — will attempt lazy init on first use');
  window.supabaseClient = null;
}

// ─────────────────────────────────────────────────────────────────────────────
// LAZY-INIT GETTER
// Guarantees a valid client even if the Supabase CDN script hadn't fully
// executed by the time api.js ran (e.g., slow CDN, parse-order race).
// All pages should call window.getSupabaseClient() instead of reading
// window.supabaseClient directly.
// ─────────────────────────────────────────────────────────────────────────────
window.getSupabaseClient = function () {
  if (!window.supabaseClient && typeof supabase !== 'undefined') {
    window.supabaseClient = supabase.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY);
    console.log('[C3DW API] ✅ Supabase client lazy-initialized');
  }
  return window.supabaseClient;
};

// ─────────────────────────────────────────────────────────────────────────────
// SECURE SECRET INITIALIZATION
// Initialize to null — populated by one of two paths below:
//   1. Electron: main.cjs injects values via executeJavaScript() after load
//   2. Web/Vercel: fetched from /api/env serverless endpoint below
// ─────────────────────────────────────────────────────────────────────────────
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
