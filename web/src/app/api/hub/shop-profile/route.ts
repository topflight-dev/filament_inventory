/**
 * api/hub/shop-profile/route.ts — Admin Hub Shop Name Self-Service
 * ─────────────────────────────────────────────────────────────────────────────
 * Lets an already-authenticated shop view and set its own shop_name. Added
 * 2026-09-26 alongside the shop-name onboarding pass (see
 * claude/dashboard-domain-split-plan.md) — previously shop_name only ever
 * got set by direct SQL when Luis created a shop row by hand, which doesn't
 * scale past his own shop and left the sidebar's shop-name line silently
 * blank for any shop that never got one. shop_slug is always derived from
 * the verified Hub session cookie (getHubSessionFromRequest) — never from
 * the request body — so a caller can never read or set another shop's name.
 *
 * GET returns the current name (used to prefill ShopNameModal in its
 * editable-anytime mode; the mandatory first-login mode skips this fetch
 * entirely, since a missing name is the whole reason it's showing).
 *
 * PATCH requires a non-empty, ≤80-char name, and also re-signs the session
 * cookie with the updated shop_name baked in — the cookie (not just the
 * database) is what /api/hub/session and the rest of the Hub read for
 * display, so without this a saved name wouldn't show up anywhere until the
 * next login.
 * ─────────────────────────────────────────────────────────────────────────────
 */
import { NextRequest, NextResponse } from 'next/server';
import {
  createHubSessionToken,
  getHubSessionFromRequest,
  HUB_SESSION_COOKIE,
  SESSION_DURATION_SECONDS,
} from '@/lib/hub-session';
import { createServiceClient } from '@/lib/supabase/service';
import { getShopName, updateShopName } from '@/lib/supabase/hub-queries';

const MAX_SHOP_NAME_LENGTH = 80;

export async function GET(request: NextRequest) {
  const session = await getHubSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createServiceClient();

  try {
    const shopName = await getShopName(supabase, session.shop_slug);
    return NextResponse.json({ shopName });
  } catch (err) {
    console.error('[C3DW Hub Shop Profile] GET failed:', err);
    return NextResponse.json({ error: 'Failed to load shop profile' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const session = await getHubSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: { shopName?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const trimmed = typeof body.shopName === 'string' ? body.shopName.trim() : '';

  if (!trimmed) {
    return NextResponse.json({ error: 'Shop name is required' }, { status: 400 });
  }
  if (trimmed.length > MAX_SHOP_NAME_LENGTH) {
    return NextResponse.json(
      { error: `Shop name must be ${MAX_SHOP_NAME_LENGTH} characters or fewer` },
      { status: 400 }
    );
  }

  const supabase = createServiceClient();

  try {
    await updateShopName(supabase, session.shop_slug, trimmed);

    const token = await createHubSessionToken({ shop_slug: session.shop_slug, shop_name: trimmed });
    const response = NextResponse.json({ ok: true, shopName: trimmed });

    response.cookies.set(HUB_SESSION_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: SESSION_DURATION_SECONDS,
    });

    return response;
  } catch (err) {
    console.error('[C3DW Hub Shop Profile] PATCH failed:', err);
    return NextResponse.json({ error: 'Failed to save shop name' }, { status: 500 });
  }
}
