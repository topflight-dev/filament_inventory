/**
 * api/public/colors/route.ts — Public Per-Shop In-Stock Colors (server-side, shop-scoped)
 * ─────────────────────────────────────────────────────────────────────────────
 * Fixes a real, confirmed cross-tenant data leak found 2026-09-29: the
 * `colors` table had an RLS policy ("Enable read access for all users",
 * qual=true) plus a full anon grant on every column, including shop_slug.
 * That meant anyone with the public Supabase anon key — trivially visible in
 * this app's own client bundle — could call the database directly with no
 * filter and read EVERY shop's entire color list, confirmed empirically by
 * querying as the `anon` Postgres role and getting back both crafted3d's and
 * riverside-3d-prints' full rows. The app itself only ever showed a visitor
 * their own shop's colors because request/page.tsx and queries.ts both
 * applied a client-side `.eq('shop_slug', ...)` filter — a courtesy, not a
 * boundary, since nothing stopped a caller from skipping that filter
 * entirely and hitting the table directly.
 *
 * This route is the replacement boundary: it's the ONLY supported way to read
 * public in-stock colors for a shop now that anon's direct grant on `colors`
 * is revoked (see the accompanying Supabase migration — DROP POLICY +
 * REVOKE). It uses the SERVICE ROLE client (bypasses RLS, server-only, never
 * bundled to the browser — see lib/supabase/service.ts's own header comment)
 * and requires an explicit `shop` query param: there is no "no shop = every
 * shop" code path here, unlike the old getInStockColors(shopSlug?) which
 * silently skipped its own filter when shopSlug was falsy.
 *
 * A shop's slug isn't a secret — shop owners already share it openly via
 * their own /request?shop=<slug> links (see the Hub's "Share Your Link"
 * feature) — so a valid request here only ever gets what that one shop
 * already intends the public to see: its own in-stock filament list. No rate
 * limiting is applied, unlike api/print-request/route.ts, because this is a
 * read with no write/spam cost and no way to pull more than one shop's data
 * per request even if hammered.
 *
 * Callers: components/(marketing)/request/page.tsx (client-side, replacing
 * its former direct `.from('colors')` anon call) and
 * lib/supabase/queries.ts's getInStockColors (server-side, for
 * (marketing)/inventory/page.tsx) both now route through here or through the
 * equivalent service-role query — see queries.ts's own updated header
 * comment for why that one calls the service client directly instead of
 * fetching this route internally.
 * ─────────────────────────────────────────────────────────────────────────────
 */
import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';

const MAX_SHOP_SLUG_LENGTH = 100;

export async function GET(request: NextRequest) {
  const shopSlug = request.nextUrl.searchParams.get('shop')?.trim() ?? '';

  if (!shopSlug || shopSlug.length > MAX_SHOP_SLUG_LENGTH) {
    return NextResponse.json({ error: 'A valid shop parameter is required' }, { status: 400 });
  }

  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from('colors')
    .select('*')
    .eq('inStock', true)
    .eq('shop_slug', shopSlug)
    .order('color', { ascending: true });

  if (error) {
    console.error('[Printcue] public/colors: query failed:', error.message);
    return NextResponse.json({ error: 'Failed to load inventory' }, { status: 500 });
  }

  return NextResponse.json(data ?? []);
}
