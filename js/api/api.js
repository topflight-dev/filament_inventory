/**
 * api.js — API Gateway
 * Central configuration for all Supabase/backend communication.
 * Import this file in any page that needs to talk to the API.
 *
 * Environment Detection:
 *   - Electron desktop app loads via file: protocol → routes to localhost:3000
 *   - Local dev server (localhost / 127.0.0.1) → routes to localhost:3000
 *   - Any live domain (Render, GitHub Pages, etc.) → routes to production Render backend
 *
 * Usage (in a <script> tag or module):
 *   <script src="./js/api/api.js"></script>
 *   Then use: window.API_BASE, window.PRINT_QUEUE_BASE, and window.ADMIN_KEY
 */

// Detect if running inside Electron (file: protocol) or a local dev server
const isLocal = (
  window.location.protocol === 'file:' ||
  window.location.hostname === 'localhost' ||
  window.location.hostname === '127.0.0.1'
);

// Switch base URL based on environment
const _BASE = isLocal
  ? 'http://localhost:3000'
  : 'https://filament-inventory.onrender.com';

// Expose on window so inline scripts in HTML files can access them
window.API_BASE         = _BASE + '/inventory';
window.PRINT_QUEUE_BASE = _BASE + '/print-queue';
window.ADMIN_KEY        = 'CRAft3DW0RKSHOP-SuP3R-K3Y-2026';
