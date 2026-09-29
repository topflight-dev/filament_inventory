import Header from '@/components/layout/Header';
import InventoryGrid from './_components/InventoryGrid';
import { getInStockColors } from '@/lib/supabase/queries';

/**
 * Inventory ("/inventory") — public filament inventory display.
 * Full vertical-slice port of inventory.html + js/inventory.js:
 *   - Server Component fetches live `colors` rows (inStock=true) directly
 *     via the Supabase server client (src/lib/supabase/server.ts) — no
 *     client-side round trip, no /api/env dependency.
 *   - Interactive search + finish filtering is delegated to the
 *     <InventoryGrid /> Client Component, operating on the already-fetched
 *     data (matches legacy client-side filter behavior).
 *
 * Revalidate every 60s (ISR) so the page also organically helps keep the
 * Supabase free-tier project "awake" on real traffic, per Project_Log.md
 * Phase 1 Part 3 Rule 4 (Keep-Alive Architecture).
 *
 * Restyled for the "Creative Studio" warm theme: cream page background
 * (#FDFBF7) matching the rest of the site, charcoal heading text — the
 * data table/card styling itself lives in <InventoryGrid />.
 *
 * UPDATED 2026-09-26 (multi-tenant safety): this page previously called
 * getInStockColors() with no shop filter, so it showed every shop's colors
 * mixed together in the `colors` table, not just this site's own. Harmless
 * today only because no other shop has any color rows yet (confirmed via
 * Supabase — see claude/dashboard-domain-split-plan.md in the Claude
 * Project), but the same latent gap /request had before its own fix. This
 * marketing page is inherently single-tenant — it's Luis's own storefront,
 * not a per-tenant route like /request — so it's scoped to exactly this
 * site's own shop via NEXT_PUBLIC_DEFAULT_SHOP_SLUG (the same env var
 * /request already uses to mean "this deployment's own shop").
 *
 * UPDATED 2026-09-29 — the "harmless today" note above turned out not to
 * stay true: a second shop (the "riverside-3d-prints" test shop) now has
 * color rows, and a real cross-tenant leak was confirmed at the database
 * level (see queries.ts's updated header comment and
 * api/public/colors/route.ts). getInStockColors now REQUIRES a shopSlug and
 * queries via the service-role client, so this page's own behavior is
 * unchanged, but it's no longer resting on "no other shop has data yet" —
 * it's enforced by the query itself. Added an explicit guard here too: if
 * NEXT_PUBLIC_DEFAULT_SHOP_SLUG is ever unset, this page now fails loudly
 * (empty list + a logged error) instead of silently falling through to
 * fetching every shop's colors, which is exactly the failure mode that
 * created this gap in the first place.
 */
export const revalidate = 60;

export default async function InventoryPage() {
  const shopSlug = process.env.NEXT_PUBLIC_DEFAULT_SHOP_SLUG ?? '';
  if (!shopSlug) {
    console.error('[Printcue] /inventory: NEXT_PUBLIC_DEFAULT_SHOP_SLUG is not set — showing an empty list rather than every shop’s colors.');
  }
  const items = await getInStockColors(shopSlug);

  return (
    <>
      <Header
        activePath="/inventory"
        subtitle="Please choose from the available colors below!"
      />
      <div className="bg-[#FDFBF7]">
        <main className="pb-10">
          <h2 className="mt-8 text-center text-2xl font-semibold text-[#3D3D3D]">
            Filament Inventory
          </h2>
          <InventoryGrid items={items} />
        </main>
      </div>
    </>
  );
}
