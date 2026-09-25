/**
 * api/hub/finishes/route.ts — Admin Hub Finish Dropdown (server-side, shop-scoped)
 * ─────────────────────────────────────────────────────────────────────────────
 * Moves the finishes list read server-side, using the verified Hub session
 * cookie as the sole source of truth for which shop's colors rows back the
 * finish dropdown. The client never supplies shop_slug directly.
 *
 * GET: returns the merged standard + shop-specific finish list.
 * ─────────────────────────────────────────────────────────────────────────────
 */
import { NextRequest, NextResponse } from 'next/server';
import { getHubSessionFromRequest } from '@/lib/hub-session';
import { createServiceClient } from '@/lib/supabase/service';
import { getFinishes } from '@/lib/supabase/hub-queries';

export async function GET(request: NextRequest) {
  const session = await getHubSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createServiceClient();

  try {
    const finishes = await getFinishes(supabase, session.shop_slug);
    return NextResponse.json(finishes);
  } catch (err) {
    console.error('[C3DW Hub Finishes] GET failed:', err);
    return NextResponse.json({ error: 'Failed to load finishes' }, { status: 500 });
  }
}
