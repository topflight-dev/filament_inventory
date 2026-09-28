/**
 * lib/supabase/signup-queries.ts — Invite-Gated Self-Serve Sign-Up Data Access
 * ─────────────────────────────────────────────────────────────────────────────
 * Backs POST /api/hub/signup (see that file for the full flow). Kept separate
 * from hub-queries.ts (which is scoped to routes that already have a verified
 * session) since everything here runs BEFORE a session exists — it's what
 * creates the shop and, by extension, the tenant a session will belong to.
 *
 * All three functions take the service-role client and are meant to be
 * called only from that server route, never from client code.
 * ─────────────────────────────────────────────────────────────────────────────
 */
import { SupabaseClient } from '@supabase/supabase-js';

export type Invite = {
  id: string;
  code: string;
  grants_plan: string;
  used_by: string | null;
  used_at: string | null;
};

/**
 * Atomically claims an invite code: only succeeds if the code exists AND
 * hasn't already been used. The `used_at is null` filter inside the UPDATE
 * itself (not a separate SELECT-then-UPDATE) is what makes this race-safe —
 * two simultaneous redemptions of the same code can't both succeed, since
 * Postgres serializes the two UPDATEs and only the first one finds a
 * matching (still-unused) row.
 *
 * Returns the claimed invite row, or null if the code is invalid or was
 * already used by the time this ran. `used_by` (which shop ended up using
 * it) is filled in afterward by markInviteUsedBy, once the new shop's slug
 * is known — see the header comment for why this is two steps.
 */
export async function claimInvite(
  supabase: SupabaseClient,
  code: string
): Promise<Invite | null> {
  const { data, error } = await supabase
    .from('invites')
    .update({ used_at: new Date().toISOString() })
    .eq('code', code)
    .is('used_at', null)
    .select('id, code, grants_plan, used_by, used_at')
    .maybeSingle();

  if (error) throw error;
  return (data as Invite) ?? null;
}

/** Best-effort — records which shop redeemed the invite, for Luis's own visibility. Never blocks sign-up if it fails. */
export async function markInviteUsedBy(
  supabase: SupabaseClient,
  inviteId: string,
  shopSlug: string
): Promise<void> {
  const { error } = await supabase
    .from('invites')
    .update({ used_by: shopSlug })
    .eq('id', inviteId);

  if (error) {
    console.warn('[C3DW] markInviteUsedBy failed (non-critical):', error.message);
  }
}

const MAX_SLUG_LENGTH = 40;
const MAX_SLUG_ATTEMPTS = 50;

/** lowercase, spaces/punctuation collapsed to single hyphens, trimmed of leading/trailing hyphens, capped in length. */
function slugify(input: string): string {
  const base = input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, MAX_SLUG_LENGTH)
    .replace(/-+$/g, '');

  return base || 'shop';
}

/**
 * Turns a business/shop name into a unique `shop_slug`. Tries the plain
 * slugified name first, then `-2`, `-3`, ... until an unused one is found
 * (backed by the DB's own UNIQUE constraint on shop_slug as a final
 * safety net if two sign-ups somehow race on the same base name).
 */
export async function generateUniqueShopSlug(
  supabase: SupabaseClient,
  shopName: string
): Promise<string> {
  const base = slugify(shopName);

  for (let attempt = 0; attempt < MAX_SLUG_ATTEMPTS; attempt++) {
    const candidate = attempt === 0 ? base : `${base}-${attempt + 1}`;

    const { data, error } = await supabase
      .from('shops')
      .select('shop_slug')
      .eq('shop_slug', candidate)
      .maybeSingle();

    if (error) throw error;
    if (!data) return candidate;
  }

  throw new Error('Could not generate a unique shop slug after multiple attempts');
}

export type NewShop = {
  shop_slug: string;
  shop_name: string;
};

/**
 * Creates the new shop row. `passcode` (the legacy plaintext column — see
 * lib/hub-session.ts / api/hub/login for why it's unused) is deliberately
 * left null rather than storing the tester's real passcode in plaintext;
 * the column was relaxed to nullable for exactly this (see
 * claude/printcue-test-release-plan.md in the Claude Project). Only
 * `passcode_hash` (bcrypt) is ever written for a self-serve shop.
 */
export async function createShop(
  supabase: SupabaseClient,
  params: {
    shopSlug: string;
    shopName: string;
    passcodeHash: string;
    plan: string;
  }
): Promise<NewShop> {
  const { data, error } = await supabase
    .from('shops')
    .insert([
      {
        shop_slug: params.shopSlug,
        shop_name: params.shopName,
        passcode_hash: params.passcodeHash,
        plan: params.plan,
      },
    ])
    .select('shop_slug, shop_name')
    .single();

  if (error) throw error;
  return data as NewShop;
}
