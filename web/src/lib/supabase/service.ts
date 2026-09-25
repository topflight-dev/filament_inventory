/**
 * lib/supabase/service.ts — Service-Role Supabase Client (SERVER-ONLY)
 * ─────────────────────────────────────────────────────────────────────────────
 * Creates a Supabase client authenticated with the SERVICE ROLE key, which
 * bypasses Row Level Security entirely. This is intentionally NOT the same
 * client as lib/supabase/client.ts (browser, anon key) or
 * lib/supabase/server.ts (server, anon key + cookie-based user session).
 *
 * SECURITY: SUPABASE_SERVICE_ROLE_KEY has full read/write access to every
 * table regardless of RLS policy. This module must only ever be imported
 * from server-only code — Route Handlers (app/api/**\/route.ts) — and must
 * NEVER be imported from a 'use client' component or anything that could be
 * bundled into the browser. Do not export or expose this key to the client.
 * ─────────────────────────────────────────────────────────────────────────────
 */
import { createClient } from '@supabase/supabase-js';

export function createServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error(
      'Missing required environment variable(s): ' +
        [
          !url && 'NEXT_PUBLIC_SUPABASE_URL',
          !serviceRoleKey && 'SUPABASE_SERVICE_ROLE_KEY',
        ]
          .filter(Boolean)
          .join(', ')
    );
  }

  return createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
