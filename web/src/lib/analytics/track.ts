/**
 * lib/analytics/track.ts — Site Visit Tracker (Next.js port)
 * ─────────────────────────────────────────────────────────────────────────────
 * Ported 1:1 from js/utils/tracker.js. Writes directly to the Supabase
 * `site_traffic` table (SACRED, IMMUTABLE schema — page_path, user_agent).
 * Intended to be called once per page load from a Client Component
 * (e.g. a small <TrackerBeacon /> mounted in the root layout).
 *
 * Developer mode: append ?dev=true to any URL to opt out of tracking,
 * matching legacy behavior exactly.
 * ─────────────────────────────────────────────────────────────────────────────
 */
'use client';

import { createClient } from '@/lib/supabase/client';

export function trackVisit() {
  if (typeof window === 'undefined') return;

  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('dev') === 'true') {
    localStorage.setItem('developer_mode', 'true');
    alert('Developer Mode Activated: Your visits will no longer be tracked.');
  }

  const isDeveloper = localStorage.getItem('developer_mode') === 'true';
  const hasBeenTracked = sessionStorage.getItem('visited_this_session');

  if (isDeveloper || hasBeenTracked) return;

  const supabase = createClient();

  supabase
    .from('site_traffic')
    .insert([
      {
        page_path: window.location.pathname,
        user_agent: navigator.userAgent,
      },
    ])
    .then(({ error }) => {
      if (error) {
        console.warn('[C3DW Tracker] Insert error:', error.message);
      } else {
        sessionStorage.setItem('visited_this_session', 'true');
      }
    });
}
