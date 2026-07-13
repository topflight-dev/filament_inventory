'use client';

import { useEffect } from 'react';
import { trackVisit } from '@/lib/analytics/track';

/**
 * TrackerBeacon — invisible client component mounted once in the root layout.
 * Fires trackVisit() on mount, replicating the legacy js/utils/tracker.js
 * behavior (one insert into `site_traffic` per session, skippable via ?dev=true).
 */
export default function TrackerBeacon() {
  useEffect(() => {
    trackVisit();
  }, []);

  return null;
}
