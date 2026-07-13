/**
 * lib/supabase/queries.ts — Shared Data Access Layer
 * ─────────────────────────────────────────────────────────────────────────────
 * Centralized query functions against the SACRED, IMMUTABLE Supabase schema
 * (`colors`, `print_jobs`, `shops`, `site_traffic`). Table/column names are
 * reused exactly as-is from the legacy vanilla-JS implementation
 * (js/inventory.js, hub.html, request.html) — see Project_Log.md Phase 1
 * "Database Sacrosanctity" section.
 * ─────────────────────────────────────────────────────────────────────────────
 */
import { createClient } from './server';

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
 * Fetch in-stock filament colors for the public inventory page, optionally
 * scoped to a single shop via shop_slug (multi-tenant client-side-safe filter —
 * defense-in-depth alongside future RLS policies per Phase 1 Part 3 Rule 2).
 */
export async function getInStockColors(shopSlug?: string): Promise<ColorRecord[]> {
  const supabase = await createClient();

  let query = supabase
    .from('colors')
    .select('*')
    .eq('inStock', true);

  if (shopSlug) {
    query = query.eq('shop_slug', shopSlug);
  }

  const { data, error } = await query.order('color', { ascending: true });

  if (error) {
    console.error('[C3DW] getInStockColors error:', error.message);
    return [];
  }

  return (data ?? []) as ColorRecord[];
}
