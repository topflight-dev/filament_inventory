/**
 * api/hub/change-passcode/route.ts — Admin Hub Self-Service Passcode Change
 * ─────────────────────────────────────────────────────────────────────────────
 * Lets an already-authenticated shop change its own passcode. shop_slug is
 * always derived from the verified Hub session cookie (getHubSessionFromRequest)
 * — never from the request body — so a caller can never target another shop.
 *
 * Verifies the supplied currentPasscode against passcode_hash (service role,
 * bcrypt.compare) before writing a fresh bcrypt hash of newPasscode via
 * updateShopPasscodeHash. The plaintext `passcode` column is never read,
 * compared, or written here — untouched, per Database Sacrosanctity. Neither
 * passcode value is ever logged, on success or failure.
 *
 * The existing session cookie remains valid after a successful change — no
 * forced re-login.
 * ─────────────────────────────────────────────────────────────────────────────
 */
import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { getHubSessionFromRequest } from '@/lib/hub-session';
import { createServiceClient } from '@/lib/supabase/service';
import { getShopPasscodeHash, updateShopPasscodeHash } from '@/lib/supabase/hub-queries';

export async function POST(request: NextRequest) {
  const session = await getHubSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: { currentPasscode?: unknown; newPasscode?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  if (typeof body.currentPasscode !== 'string' || typeof body.newPasscode !== 'string') {
    return NextResponse.json({ error: 'Current and new passcode are required' }, { status: 400 });
  }

  const currentPasscode = body.currentPasscode;
  const newPasscode = body.newPasscode.trim();

  if (newPasscode.length < 6) {
    return NextResponse.json(
      { error: 'New passcode must be at least 6 characters' },
      { status: 400 }
    );
  }

  const supabase = createServiceClient();

  try {
    const passcodeHash = await getShopPasscodeHash(supabase, session.shop_slug);

    if (!passcodeHash || !(await bcrypt.compare(currentPasscode, passcodeHash))) {
      return NextResponse.json({ error: 'Current passcode is incorrect' }, { status: 401 });
    }

    const newHash = await bcrypt.hash(newPasscode, 10);
    await updateShopPasscodeHash(supabase, session.shop_slug, newHash);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[C3DW Hub Change Passcode] Failed:', err);
    return NextResponse.json({ error: 'Failed to change passcode' }, { status: 500 });
  }
}
