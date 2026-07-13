/**
 * api/keepalive/route.ts — Vercel Cron Keep-Alive Endpoint
 * ─────────────────────────────────────────────────────────────────────────────
 * Replaces the legacy Uptime Robot external ping strategy. Intended to be
 * invoked on a schedule via vercel.json's `crons` array (Phase 1 Part 3
 * Rule 4 — Keep-Alive Architecture). Runs a trivial read-only query against
 * the sacred `colors` table to keep the Supabase free-tier project awake,
 * without requiring any `functions`/`runtime` block in vercel.json.
 * ─────────────────────────────────────────────────────────────────────────────
 */
import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET() {
  const supabase = await createClient();

  const { error } = await supabase.from('colors').select('id').limit(1);

  if (error) {
    console.error('[C3DW Keepalive] Ping failed:', error.message);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, timestamp: new Date().toISOString() });
}
