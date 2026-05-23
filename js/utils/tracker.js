/**
 * tracker.js — Site Visit Tracker
 * ─────────────────────────────────────────────────────────────────────────────
 * Records page visits directly to the Supabase `site_traffic` table via the
 * shared supabaseClient from api.js. No Express proxy or Render backend needed.
 *
 * Developer mode: append ?dev=true to any URL to opt out of tracking.
 * ─────────────────────────────────────────────────────────────────────────────
 */

const urlParams = new URLSearchParams(window.location.search);
if (urlParams.get('dev') === 'true') {
    localStorage.setItem('developer_mode', 'true');
    alert('Developer Mode Activated: Your visits will no longer be tracked.');
}

const isDeveloper    = localStorage.getItem('developer_mode') === 'true';
const hasBeenTracked = sessionStorage.getItem('visited_this_session');

if (!isDeveloper && !hasBeenTracked) {
    // Use the shared Supabase client from api.js.
    // Guard: wait briefly if the client hasn't initialized yet (race condition
    // when the SDK and api.js load in parallel on some pages).
    function _doTrack() {
        const client = window.supabaseClient;
        if (!client) {
            console.warn('[C3DW Tracker] supabaseClient not ready — tracking skipped');
            return;
        }
        client
            .from('site_traffic')
            .insert([{
                page_path:  window.location.pathname,
                user_agent: navigator.userAgent
            }])
            .then(({ error }) => {
                if (error) {
                    console.warn('[C3DW Tracker] Insert error:', error.message);
                } else {
                    sessionStorage.setItem('visited_this_session', 'true');
                }
            })
            .catch(err => console.warn('[C3DW Tracker] Tracking skipped:', err));
    }

    // Small defer to allow api.js client init to complete if loaded concurrently
    if (window.supabaseClient) {
        _doTrack();
    } else {
        setTimeout(_doTrack, 300);
    }
}
