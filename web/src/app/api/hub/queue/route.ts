/**
 * api/hub/queue/route.ts — Admin Hub Print Queue (server-side, shop-scoped)
 * ─────────────────────────────────────────────────────────────────────────────
 * Moves print_jobs queue reads/deletes server-side, using the verified Hub
 * session cookie (see lib/hub-session.ts) as the sole source of truth for
 * which shop's rows are touched. The client (QueueTable.tsx) never supplies
 * shop_slug directly — it is always derived here from the signed session.
 *
 * GET: returns the shop's queue jobs (active or completed).
 * DELETE: batch-deletes jobs by id, scoped to the session's shop_slug.
 * ─────────────────────────────────────────────────────────────────────────────
 */
import { NextRequest, NextResponse } from 'next/server';
import { getHubSessionFromRequest } from '@/lib/hub-session';
import { createServiceClient } from '@/lib/supabase/service';
import { getQueueJobs, batchDeleteJobs, type QueueStatusFilter } from '@/lib/supabase/hub-queries';

export async function GET(request: NextRequest) {
  const session = await getHubSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const filterParam = request.nextUrl.searchParams.get('filter');
  const filter: QueueStatusFilter = filterParam === 'completed' ? 'completed' : 'active';

  const supabase = createServiceClient();

  try {
    const jobs = await getQueueJobs(supabase, session.shop_slug, filter);
    return NextResponse.json(jobs);
  } catch (err) {
    console.error('[C3DW Hub Queue] GET failed:', err);
    return NextResponse.json({ error: 'Failed to load queue' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const session = await getHubSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: { ids?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const ids = Array.isArray(body.ids) ? body.ids.filter((id): id is string => typeof id === 'string') : [];
  if (ids.length === 0) {
    return NextResponse.json({ error: 'No ids provided' }, { status: 400 });
  }

  const supabase = createServiceClient();

  try {
    const deleted = await batchDeleteJobs(supabase, ids, session.shop_slug);
    return NextResponse.json({ ok: true, deletedCount: deleted.length });
  } catch (err) {
    console.error('[C3DW Hub Queue] DELETE failed:', err);
    return NextResponse.json({ error: 'Failed to delete jobs' }, { status: 500 });
  }
}
