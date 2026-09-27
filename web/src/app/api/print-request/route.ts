/**
 * api/print-request/route.ts — Server-Side Print-Job Intake
 * ─────────────────────────────────────────────────────────────────────────────
 * Moves the print_jobs INSERT server-side. The public /request page used to
 * insert directly into print_jobs using the anon Supabase client; an RLS
 * audit (2026-09-27, see claude/printcue-test-release-plan.md in the Claude
 * Project) found that insert path fully unrestricted at BOTH the RLS policy
 * level (with_check = true) AND the underlying Postgres column-privilege
 * level (anon had column-level INSERT on every column, including shop_slug)
 * — meaning anyone holding the public anon key (shipped in every browser
 * bundle, by design) could insert a print_jobs row tagged with ANY shop's
 * shop_slug, real or made up. Not a data-exposure risk (anon still has no
 * SELECT/UPDATE/DELETE on this table — only the Hub, via the service-role
 * client, ever reads the queue), but a genuine spam/griefing vector.
 *
 * This route closes that. The client now POSTs here; the service-role client
 * (which bypasses RLS entirely, by design — see lib/supabase/service.ts)
 * does the actual insert. The anon INSERT grant/policy on print_jobs has
 * been revoked in Supabase alongside this change, so a direct
 * `.from('print_jobs').insert(...)` from the browser can no longer succeed
 * at all, RLS-bypass or not — this route is now the ONLY path a print job
 * can be created through.
 *
 * Because a service-role insert bypasses every database-level guard, this
 * route does the two checks that used to come (incompletely) from RLS:
 *   - shop_slug existence check — reject a request tagged with a shop that
 *     doesn't exist, rather than silently creating an orphaned row.
 *   - basic per-shop rate limit — reject if this shop_slug has already
 *     received RATE_LIMIT_MAX submissions in the last RATE_LIMIT_WINDOW_MS,
 *     counted from print_jobs itself (no new table/external service needed).
 * Neither is a substitute for a real bot-check (e.g. a CAPTCHA) if this ever
 * opens up beyond a small, invite-only set of test shops — this is the
 * database-hardening piece, not the full abuse-prevention story.
 * ─────────────────────────────────────────────────────────────────────────────
 */
import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';

const MAX_NAME_LENGTH = 200;
const MAX_PROJECT_NAME_LENGTH = 300;
const MAX_URL_LENGTH = 500;
const MAX_COLOR_PREFERENCE_LENGTH = 300;

const RATE_LIMIT_WINDOW_MS = 60_000; // 1 minute
const RATE_LIMIT_MAX = 5; // max print-request submissions per shop per window

export async function POST(request: NextRequest) {
  let body: {
    shopSlug?: unknown;
    requestorName?: unknown;
    projectName?: unknown;
    stlUrl?: unknown;
    filamentId?: unknown;
    colorPreference?: unknown;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const shopSlug = typeof body.shopSlug === 'string' ? body.shopSlug.trim() : '';
  const requestorName = typeof body.requestorName === 'string' ? body.requestorName.trim() : '';
  const projectName = typeof body.projectName === 'string' ? body.projectName.trim() : '';
  const stlUrl = typeof body.stlUrl === 'string' ? body.stlUrl.trim() : '';
  const colorPreference =
    typeof body.colorPreference === 'string' ? body.colorPreference.trim() : '';
  const filamentId =
    typeof body.filamentId === 'number' && Number.isFinite(body.filamentId)
      ? body.filamentId
      : NaN;

  if (
    !shopSlug ||
    !requestorName ||
    !projectName ||
    !colorPreference ||
    !Number.isInteger(filamentId) ||
    filamentId <= 0
  ) {
    return NextResponse.json({ error: 'Missing or invalid fields' }, { status: 400 });
  }

  if (
    requestorName.length > MAX_NAME_LENGTH ||
    projectName.length > MAX_PROJECT_NAME_LENGTH ||
    stlUrl.length > MAX_URL_LENGTH ||
    colorPreference.length > MAX_COLOR_PREFERENCE_LENGTH
  ) {
    return NextResponse.json({ error: 'One or more fields is too long' }, { status: 400 });
  }

  const supabase = createServiceClient();

  // A service-role insert bypasses RLS entirely, so this lookup — not RLS —
  // is now the only thing standing between a bad/made-up shopSlug and an
  // orphaned row nobody's Hub will ever see.
  const { data: shop, error: shopLookupError } = await supabase
    .from('shops')
    .select('shop_slug')
    .eq('shop_slug', shopSlug)
    .maybeSingle();

  if (shopLookupError) {
    console.error('[C3DW] print-request: shop lookup failed:', shopLookupError.message);
    return NextResponse.json({ error: 'Could not verify shop' }, { status: 500 });
  }
  if (!shop) {
    return NextResponse.json({ error: 'Unknown shop' }, { status: 404 });
  }

  // Basic per-shop rate limit, counted from print_jobs itself — no new
  // table or external service needed. A check failure here fails open
  // (logs a warning, allows the request) rather than blocking a legitimate
  // customer's submission over an unrelated database hiccup.
  const windowStart = new Date(Date.now() - RATE_LIMIT_WINDOW_MS).toISOString();
  const { count, error: rateLimitError } = await supabase
    .from('print_jobs')
    .select('id', { count: 'exact', head: true })
    .eq('shop_slug', shopSlug)
    .gte('created_at', windowStart);

  if (rateLimitError) {
    console.warn(
      '[C3DW] print-request: rate-limit check failed (allowing request):',
      rateLimitError.message
    );
  } else if ((count ?? 0) >= RATE_LIMIT_MAX) {
    return NextResponse.json(
      { error: 'Too many requests — please wait a moment and try again.' },
      { status: 429 }
    );
  }

  const payload = {
    requestor_name: requestorName,
    project_name: projectName,
    stl_url: stlUrl || null,
    filament_id: filamentId,
    color_preference: colorPreference,
    status: 'Pending',
    shop_slug: shopSlug,
  };

  const { error: insertError } = await supabase.from('print_jobs').insert([payload]);

  if (insertError) {
    console.error('[C3DW] print-request: insert failed:', insertError.message);
    return NextResponse.json({ error: 'Failed to submit request' }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
