/**
 * api/hub/signup/route.ts — Invite-Gated Self-Serve Sign-Up
 * ─────────────────────────────────────────────────────────────────────────────
 * Piece #1 of the Printcue test-release plan (see
 * claude/printcue-test-release-plan.md in the Claude Project). Lets a
 * tester holding a valid invite code create their own shop, rather than
 * Luis inserting a `shops` row by hand and handing out credentials
 * out-of-band, which was the only path that existed before this.
 *
 * Flow:
 *   1. Validate the request body (shop name, invite code, chosen passcode).
 *   2. Atomically claim the invite (see claimInvite in signup-queries.ts —
 *      this is what makes double-redemption of the same code impossible).
 *   3. Generate a unique shop_slug from the shop name.
 *   4. Hash the chosen passcode (bcrypt, same cost factor as
 *      change-passcode/route.ts, for consistency) and insert the new
 *      `shops` row — plan comes from the invite's own grants_plan, so a
 *      hand-picked tester's invite can grant 'lifetime_free' while a later,
 *      more general invite grants plain 'free'.
 *   5. Record which shop redeemed the invite (best-effort, for Luis's own
 *      visibility into who's signed up).
 *   6. Issue the session cookie exactly the way /api/hub/login does, and
 *      return the new shop's slug/name so the client can redirect straight
 *      into /hub — no separate login step, and no mandatory first-login
 *      "what's your shop called?" prompt, since shop_name is already set
 *      from this form.
 *
 * If the invite claim succeeds but a later step fails (e.g. shop insert
 * error), the invite is left consumed rather than being un-claimed — an
 * acceptable, rare failure mode at this scale (Luis can just issue a fresh
 * invite), and simpler than adding rollback logic for a handful of testers.
 * ─────────────────────────────────────────────────────────────────────────────
 */
import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { createServiceClient } from '@/lib/supabase/service';
import { createHubSessionToken, HUB_SESSION_COOKIE, SESSION_DURATION_SECONDS } from '@/lib/hub-session';
import { claimInvite, markInviteUsedBy, generateUniqueShopSlug, createShop } from '@/lib/supabase/signup-queries';

const MAX_SHOP_NAME_LENGTH = 80;
const MIN_PASSCODE_LENGTH = 6;

export async function POST(request: NextRequest) {
  let body: { shopName?: unknown; inviteCode?: unknown; passcode?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const shopName = typeof body.shopName === 'string' ? body.shopName.trim() : '';
  const inviteCode = typeof body.inviteCode === 'string' ? body.inviteCode.trim() : '';
  const passcode = typeof body.passcode === 'string' ? body.passcode.trim() : '';

  if (!shopName || !inviteCode || !passcode) {
    return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
  }
  if (shopName.length > MAX_SHOP_NAME_LENGTH) {
    return NextResponse.json(
      { error: `Shop name must be ${MAX_SHOP_NAME_LENGTH} characters or fewer` },
      { status: 400 }
    );
  }
  if (passcode.length < MIN_PASSCODE_LENGTH) {
    return NextResponse.json(
      { error: `Passcode must be at least ${MIN_PASSCODE_LENGTH} characters` },
      { status: 400 }
    );
  }

  const supabase = createServiceClient();

  let invite;
  try {
    invite = await claimInvite(supabase, inviteCode);
  } catch (err) {
    console.error('[C3DW Signup] Invite claim failed:', err);
    return NextResponse.json({ error: 'Could not validate invite code' }, { status: 500 });
  }

  if (!invite) {
    return NextResponse.json(
      { error: 'That invite code is invalid or has already been used' },
      { status: 403 }
    );
  }

  try {
    const shopSlug = await generateUniqueShopSlug(supabase, shopName);
    const passcodeHash = await bcrypt.hash(passcode, 10);

    const shop = await createShop(supabase, {
      shopSlug,
      shopName,
      passcodeHash,
      plan: invite.grants_plan,
    });

    await markInviteUsedBy(supabase, invite.id, shop.shop_slug);

    const token = await createHubSessionToken({
      shop_slug: shop.shop_slug,
      shop_name: shop.shop_name,
    });

    const response = NextResponse.json({ shop_slug: shop.shop_slug, shop_name: shop.shop_name });

    response.cookies.set(HUB_SESSION_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: SESSION_DURATION_SECONDS,
    });

    return response;
  } catch (err) {
    // The invite is already consumed at this point (see file header) — log
    // loudly so this doesn't silently strand a tester with a burned code.
    console.error('[C3DW Signup] Shop creation failed after invite was claimed:', err);
    return NextResponse.json({ error: 'Failed to create shop' }, { status: 500 });
  }
}
