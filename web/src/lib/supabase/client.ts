/**
 * lib/supabase/client.ts — Browser Supabase Client
 * ─────────────────────────────────────────────────────────────────────────────
 * Creates a Supabase client for use in Client Components ("use client").
 * Uses build-time NEXT_PUBLIC_* environment variables — the anon key is safe
 * to expose to the browser; Row Level Security (RLS) is the true data
 * security layer (see PROJECT_LOG.md Phase 1 constraints doc).
 *
 * This replaces the legacy /api/env round-trip + js/api/api.js pattern.
 * ─────────────────────────────────────────────────────────────────────────────
 */
import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
