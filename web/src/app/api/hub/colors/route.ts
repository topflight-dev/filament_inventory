/**
 * api/hub/colors/route.ts — Admin Hub Filament Inventory (server-side, shop-scoped)
 * ─────────────────────────────────────────────────────────────────────────────
 * Moves colors reads/inserts server-side, using the verified Hub session
 * cookie (see lib/hub-session.ts) as the sole source of truth for which
 * shop's rows are touched. The client (InventoryManager.tsx) never supplies
 * shop_slug directly — it is always derived here from the signed session.
 *
 * GET: returns the shop's inventory (colors) rows.
 * POST: inserts a new color row, forcing shop_slug from the session
 * regardless of anything the client sent or omitted.
 * ─────────────────────────────────────────────────────────────────────────────
 */
import { NextRequest, NextResponse } from 'next/server';
import { getHubSessionFromRequest } from '@/lib/hub-session';
import { createServiceClient } from '@/lib/supabase/service';
import { getColors, insertColor, type NewColorPayload } from '@/lib/supabase/hub-queries';

export async function GET(request: NextRequest) {
  const session = await getHubSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createServiceClient();

  try {
    const colors = await getColors(supabase, session.shop_slug);
    return NextResponse.json(colors);
  } catch (err) {
    console.error('[C3DW Hub Colors] GET failed:', err);
    return NextResponse.json({ error: 'Failed to load inventory' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = await getHubSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const color = typeof body.color === 'string' ? body.color.trim() : '';
  const finish = typeof body.finish === 'string' ? body.finish.trim() : '';

  if (!color || !finish) {
    return NextResponse.json({ error: 'color and finish are required' }, { status: 400 });
  }

  const payload: NewColorPayload = {
    color,
    finish,
    description: typeof body.description === 'string' ? body.description : '',
    colorHex1: typeof body.colorHex1 === 'string' ? body.colorHex1 : '#ffffff',
    colorHex2: typeof body.colorHex2 === 'string' ? body.colorHex2 : '#ffffff',
    colorHex3: typeof body.colorHex3 === 'string' ? body.colorHex3 : '#ffffff',
    inStock: typeof body.inStock === 'boolean' ? body.inStock : true,
    shop_slug: session.shop_slug,
  };

  const supabase = createServiceClient();

  try {
    const created = await insertColor(supabase, payload);
    return NextResponse.json(created, { status: 201 });
  } catch (err) {
    console.error('[C3DW Hub Colors] POST failed:', err);
    return NextResponse.json({ error: 'Failed to add filament' }, { status: 500 });
  }
}
