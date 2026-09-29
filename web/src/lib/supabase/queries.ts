/**
 * lib/supabase/queries.ts — Shared Data Access Layer
 * ─────────────────────────────────────────────────────────────────────────────
 * Centralized query functions against the SACRED, IMMUTABLE Supabase schema
 * (`colors`, `print_jobs`, `shops`, `site_traffic`). Table/column names are
 * reused exactly as-is from the legacy vanilla-JS implementation
 * (js/inventory.js, hub.html, request.html) — see Project_Log.md Phase 1
 * "Database Sacrosanctity" section.
 *
 * UPDATED 2026-09-29 — fixed a confirmed cross-tenant leak: `colors` had a
 * blanket anon-readable RLS policy, so getInStockColors(shopSlug) previously
 * ran through the anon-key server client (./server) and, when called with NO
 * shopSlug, silently skipped its own .eq('shop_slug', ...) filter and
 * returned every shop's rows — exactly the "latent gap" this file's own
 * comment on the old optional param already flagged as a risk. Now that
 * anon's grant on `colors` is revoked at the database level (see the
 * accompanying Supabase migration and api/public/colors/route.ts's header
 * comment), this function switches to the SERVICE ROLE client and makes
 * shopSlug REQUIRED — a falsy shopSlug now returns [] instead of querying at
 * all, so there is no code path left that can accidentally fetch every
 * shop's colors. Server-only: never import this file from a 'use client'
 * component, since it now pulls in the service-role client.
 * ─────────────────────────────────────────────────────────────────────────────
 */
import { createServiceClient } from './service';

export type ColorRecord = {
  id: number;
  color: string;
  finish: string;
  description: string | null;
  inStock: boolean;
  colorHex1: string | null;
  colorHex2: string | null;
  colorHex3: string | null;
  shop_slug: string | null;
};

/**
 * Fetch in-stock filament colors for the public inventory page, scoped to
 * exactly one shop. shopSlug is required — see the header comment above for
 * why: this now uses the service-role client (bypasses RLS), so unlike the
 * old optional-param version, there is no path here that can query without a
 * shop_slug filter and accidentally return every tenant's rows.
 */
export async function getInStockColors(shopSlug: string): Promise<ColorRecord[]> {
  if (!shopSlug) {
    console.warn('[Printcue] getInStockColors called with no shopSlug — returning [] rather than querying unscoped.');
    return [];
  }

  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from('colors')
    .select('*')
    .eq('inStock', true)
    .eq('shop_slug', shopSlug)
    .order('color', { ascending: true });

  if (error) {
    console.error('[C3DW] getInStockColors error:', error.message);
    return [];
  }

  return (data ?? []) as ColorRecord[];
}
