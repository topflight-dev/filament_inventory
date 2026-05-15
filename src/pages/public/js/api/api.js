/**
 * api.js — API Gateway
 * Central configuration for all Supabase/backend communication.
 * Import this file in any page that needs to talk to the API.
 *
 * Usage (in a <script> tag or module):
 *   <script src="./js/api.js"></script>
 *   Then use: window.API_BASE and window.ADMIN_KEY
 */

const API_BASE = "https://filament-inventory.onrender.com/inventory";
const ADMIN_KEY = "CRAft3DW0RKSHOP-SuP3R-K3Y-2026";

// Expose on window so inline scripts in HTML files can access them
window.API_BASE = API_BASE;
window.ADMIN_KEY = ADMIN_KEY;

// Expose Print Queue Base Routes
const PRINT_QUEUE_BASE = "https://filament-inventory.onrender.com/print-queue";
window.PRINT_QUEUE_BASE = PRINT_QUEUE_BASE;
