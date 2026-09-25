/**
 * api/hub/queue/[id]/route.ts — Admin Hub Print Queue: single-job update
 * ─────────────────────────────────────────────────────────────────────────────
 * Moves the print_jobs status-cycle and inline-edit writes server-side,
 * scoped to the shop_slug derived from the verified Hub session cookie.
 *
 * PATCH: accepts any of `status`, `requestor_name`, `project_name`,
 * `color_preference` in the body. Whichever are present are merged into a
 * single plain object and applied via one atomic updateJobFields() call
 * (status is just another column — no separate code path needed). Returns
 * 404 if no row matched the given id + shop_slug.
 * ─────────────────────────────────────────────────────────────────────────────
 */
import { NextRequest, NextResponse } from 'next/server';
import { getHubSessionFromRequest } from '@/lib/hub-session';
import { createServiceClient } from '@/lib/supabase/service';
import { updateJobFields } from '@/lib/supabase/hub-queries';

const EDITABLE_FIELDS = ['status', 'requestor_name', 'project_name', 'color_preference'] as const;

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

  const fields: Record<string, string> = {};
  for (const key of EDITABLE_FIELDS) {
    if (typeof body[key] === 'string') {
      fields[key] = body[key] as string;
    }
  }

  if (Object.keys(fields).length === 0) {
    return NextResponse.json({ error: 'No editable fields provided' }, { status: 400 });
  }

  const supabase = createServiceClient();

  try {
    const updated = await updateJobFields(supabase, id, fields, session.shop_slug);
    if (updated.length === 0) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }
    return NextResponse.json(updated[0]);
  } catch (err) {
    console.error('[C3DW Hub Queue] PATCH failed:', err);
    return NextResponse.json({ error: 'Failed to update job' }, { status: 500 });
  }
}
