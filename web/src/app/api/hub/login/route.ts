/**
 * api/hub/login/route.ts — Admin Hub Server-Side Login
 * ─────────────────────────────────────────────────────────────────────────────
 * Replaces the legacy client-side `validateShopCredentials` flow, which
 * queried the `shops` table directly from the browser with the anon key.
 * This handler validates shop_slug + passcode server-side using the
 * service-role client (bypasses RLS) against the hashed `passcode_hash`
 * column via bcrypt, then issues a signed, httpOnly session cookie.
 *
 * The `passcode` (plaintext) column is never read or compared here — only
 * `passcode_hash` is used, per Database Sacrosanctity (column left in place,
 * untouched, not part of this change).
 * ─────────────────────────────────────────────────────────────────────────────
 */
import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { createServiceClient } from '@/lib/supabase/service';
import {
  createHubSessionToken,
  HUB_SESSION_COOKIE,
  SESSION_DURATION_SECONDS,
} from '@/lib/hub-session';

export async function POST(request: NextRequest) {
  let body: { shop_slug?: unknown; passcode?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const slug = typeof body.shop_slug === 'string' ? body.shop_slug.trim().toLowerCase() : '';
  const passcode = typeof body.passcode === 'string' ? body.passcode.trim() : '';

  if (!slug || !passcode) {
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 400 });
  }

  const supabase = createServiceClient();

  const { data: shop, error } = await supabase
    .from('shops')
    .select('shop_slug, shop_name, passcode_hash')
    .eq('shop_slug', slug)
    .maybeSingle();

  if (error) {
    console.error('[C3DW Hub Login] Shop lookup failed:', error.message);
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
  }

  if (!shop || !shop.passcode_hash) {
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
  }

  const passcodeMatches = await bcrypt.compare(passcode, shop.passcode_hash);
  if (!passcodeMatches) {
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
  }

  const token = await createHubSessionToken({
    shop_slug: shop.shop_slug,
    shop_name: shop.shop_name ?? null,
  });

  const response = NextResponse.json({ shop_slug: shop.shop_slug, shop_name: shop.shop_name ?? null });

  response.cookies.set(HUB_SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_DURATION_SECONDS,
  });

  return response;
}
