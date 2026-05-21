/**
 * api.js — API Gateway
 * Central configuration for all Supabase/backend communication.
 * Import this file in any page that needs to talk to the API.
 *
 * Environment Detection:
 *   - Electron desktop app loads via file: protocol → routes to PRODUCTION Render backend
 *     (Electron has no local server running; the .exe is a standalone viewer)
 *   - Local dev server (localhost / 127.0.0.1) → routes to localhost:3000
 *   - Any live domain (Render, Vercel, etc.) → routes to production Render backend
 *
 * Usage (in a <script> tag or module):
 *   <script src="./js/api/api.js"></script>
 *   Then use: window.API_BASE, window.PRINT_QUEUE_BASE, and window.ADMIN_KEY
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
window.ADMIN_KEY        = 'CRAft3DW0RKSHOP-SuP3R-K3Y-2026';

// Supabase public credentials — safe to expose in frontend (anon key, RLS-protected)
window.SUPABASE_URL      = 'https://oyusccplccayyltmfdup.supabase.co';
window.SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im95dXNjY3BsY2NheXlsdG1mZHVwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcwODUxMDksImV4cCI6MjA4MjY2MTEwOX0.Wj7j8_bFwZOlJBcfReTdMJr7GdjqrmZIXhv9TIJA3ZA';
