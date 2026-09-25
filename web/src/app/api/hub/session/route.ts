/**
 * api/hub/session/route.ts — Admin Hub Session Check
 * ─────────────────────────────────────────────────────────────────────────────
 * Reports whether the request carries a valid, unexpired Hub session cookie.
 * Used by AuthGate on mount to decide whether to render the lockscreen or
 * pass through to the dashboard, replacing the old sessionStorage-only check.
 * ─────────────────────────────────────────────────────────────────────────────
 */
import { NextRequest, NextResponse } from 'next/server';
import { getHubSessionFromRequest } from '@/lib/hub-session';

export async function GET(request: NextRequest) {
  const session = await getHubSessionFromRequest(request);

  if (!session) {
    return NextResponse.json({ authenticated: false });
  }

  return NextResponse.json({
    authenticated: true,
    shop_slug: session.shop_slug,
    shop_name: session.shop_name ?? null,
  });
}
