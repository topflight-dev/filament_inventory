/**
 * api/hub/colors/[id]/route.ts — Admin Hub Filament Inventory: single-row update/delete
 * ─────────────────────────────────────────────────────────────────────────────
 * Moves the colors inline-edit, stock-toggle, and delete writes server-side,
 * scoped to the shop_slug derived from the verified Hub session cookie.
 *
 * PATCH: accepts any of `inStock` (boolean), `color` (string), `finish`
 * (string) in the body — the only three columns ever editable through the
 * Hub UI. This is an allowlist, not a pass-through: any other key in the
 * body is ignored. Whichever allowed keys are present are merged into a
 * single plain object and applied via one atomic updateColorFields() call.
 * Returns 404 if no row matched the given id + shop_slug.
 *
 * DELETE: removes the row scoped to id + shop_slug. Returns 404 if nothing
 * was deleted.
 * ─────────────────────────────────────────────────────────────────────────────
 */
import { NextRequest, NextResponse } from 'next/server';
import { getHubSessionFromRequest } from '@/lib/hub-session';
import { createServiceClient } from '@/lib/supabase/service';
import { updateColorFields, deleteColor } from '@/lib/supabase/hub-queries';

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const session = await getHubSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await context.params;

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const fields: Partial<{ inStock: boolean; color: string; finish: string }> = {};
  if (typeof body.inStock === 'boolean') fields.inStock = body.inStock;
  if (typeof body.color === 'string') fields.color = body.color;
  if (typeof body.finish === 'string') fields.finish = body.finish;

  if (Object.keys(fields).length === 0) {
    return NextResponse.json({ error: 'No editable fields provided' }, { status: 400 });
  }

  const supabase = createServiceClient();

  try {
    const updated = await updateColorFields(supabase, id, fields, session.shop_slug);
    if (updated.length === 0) {
      return NextResponse.json({ error: 'Filament not found' }, { status: 404 });
    }
    return NextResponse.json(updated[0]);
  } catch (err) {
    console.error('[C3DW Hub Colors] PATCH failed:', err);
    return NextResponse.json({ error: 'Failed to update filament' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const session = await getHubSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await context.params;
  const supabase = createServiceClient();

  try {
    const deleted = await deleteColor(supabase, id, session.shop_slug);
    if (deleted.length === 0) {
      return NextResponse.json({ error: 'Filament not found' }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[C3DW Hub Colors] DELETE failed:', err);
    return NextResponse.json({ error: 'Failed to delete filament' }, { status: 500 });
  }
}
