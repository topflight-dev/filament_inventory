/**
 * api/keepalive/route.ts — Vercel Cron Keep-Alive Endpoint
 * ─────────────────────────────────────────────────────────────────────────────
 * Replaces the legacy Uptime Robot external ping strategy. Intended to be
 * invoked on a schedule via vercel.json's `crons` array (Phase 1 Part 3
 * Rule 4 — Keep-Alive Architecture). Runs a trivial read-only query against
 * the sacred `colors` table to keep the Supabase free-tier project awake,
 * without requiring any `functions`/`runtime` block in vercel.json.
 *
 * UPDATED 2026-09-29 — switched from the anon-key server client to the
 * service-role client. anon's grant on `colors` was revoked as part of
 * fixing a confirmed cross-tenant leak (see api/public/colors/route.ts's
 * header comment); this endpoint doesn't care about tenant scoping at all
 * — it just needs any trivial read to keep the database warm — so the
 * service-role client is the correct tool now that anon can no longer touch
 * this table.
 * ─────────────────────────────────────────────────────────────────────────────
 */
import { createServiceClient } from '@/lib/supabase/service';
import { NextResponse } from 'next/server';

export async function GET() {
  const supabase = createServiceClient();

  const { error } = await supabase.from('colors').select('id').limit(1);

  if (error) {
    console.error('[C3DW Keepalive] Ping failed:', error.message);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, timestamp: new Date().toISOString() });
}
