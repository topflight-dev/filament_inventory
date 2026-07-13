/**
 * lib/supabase/server.ts — Server Supabase Client
 * ─────────────────────────────────────────────────────────────────────────────
 * Creates a Supabase client for use in Server Components, Route Handlers, and
 * Server Actions. Reads/writes auth cookies via Next.js `cookies()` so that
 * Supabase Auth sessions (Phase 3 — Multi-Tenant RLS via JWT claims) work
 * correctly across server-rendered requests.
 *
 * Uses the same NEXT_PUBLIC_* anon key as the browser client — RLS policies
 * are what actually protect data server-side, not secrecy of this key.
 * Server-only secrets (ADMIN_KEY, DISCORD_WEBHOOK_URL) are NEVER read here;
 * they belong exclusively in Route Handlers via process.env (no NEXT_PUBLIC_
 * prefix), per the Phase 1 constraints doc.
 * ─────────────────────────────────────────────────────────────────────────────
 */
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  );
}
