/**
 * lib/supabase/hub-queries.ts — Admin Hub Data Access Layer
 * ─────────────────────────────────────────────────────────────────────────────
 * Typed query functions backing the Admin Hub dashboard (components/hub/*).
 * All calls go through the shared browser Supabase client and reuse the
 * SACRED, IMMUTABLE table/column names exactly as-is from the legacy
 * hub.html implementation — see Project_Log.md "Database Sacrosanctity".
 * No schema changes. No renamed/dropped columns.
 * ─────────────────────────────────────────────────────────────────────────────
 */
import { SupabaseClient } from '@supabase/supabase-js';

export type PrintJob = {
  id: string;
  requestor_name: string | null;
  child_name?: string | null;
  project_name: string | null;
  stl_url: string | null;
  filament_id: number | null;
  color_preference: string | null;
  filament?: string | null;
  status: string | null;
  created_at: string | null;
  shop_slug: string | null;
};

export type ColorItem = {
  id: number | string;
  color: string;
  finish: string;
  description: string | null;
  inStock: boolean;
  colorHex1: string | null;
  colorHex2: string | null;
  colorHex3: string | null;
  shop_slug: string | null;
};

export type QueueStatusFilter = 'active' | 'completed';

/** Ported 1:1 from hub.html fetchQueue() — server-side status + shop_slug filtering. */
export async function getQueueJobs(
  supabase: SupabaseClient,
  shopSlug: string | null,
  filter: QueueStatusFilter
): Promise<PrintJob[]> {
  let query = supabase
    .from('print_jobs')
    .select('*')
    .order('created_at', { ascending: true });

  if (shopSlug) query = query.eq('shop_slug', shopSlug);

  query = filter === 'completed' ? query.eq('status', 'Completed') : query.neq('status', 'Completed');

  const { data, error } = await query;
  if (error) throw error;
  return Array.isArray(data) ? (data as PrintJob[]) : [];
}

export async function updateJobStatus(supabase: SupabaseClient, id: string, status: string) {
  const { error } = await supabase.from('print_jobs').update({ status }).eq('id', id);
  if (error) throw error;
}

export async function updateJobFields(
  supabase: SupabaseClient,
  id: string,
  fields: Record<string, string>
) {
  const { error } = await supabase.from('print_jobs').update(fields).eq('id', id);
  if (error) throw error;
}

export async function batchDeleteJobs(supabase: SupabaseClient, ids: string[]) {
  const { error } = await supabase.from('print_jobs').delete().in('id', ids);
  if (error) throw error;
}

/** Ported 1:1 from hub.html handleAuth() — validates shop_slug + passcode. */
export async function validateShopCredentials(
  supabase: SupabaseClient,
  slug: string,
  passcode: string
): Promise<{ shop_slug: string; shop_name: string | null } | null> {
  const { data, error } = await supabase
    .from('shops')
    .select('shop_slug, shop_name')
    .eq('shop_slug', slug)
    .eq('passcode', passcode)
    .maybeSingle();

  if (error) throw error;
  return data && data.shop_slug ? data : null;
}

/** Ported 1:1 from hub.html populateFinishDropdown(). */
export async function getFinishes(supabase: SupabaseClient, shopSlug: string | null): Promise<string[]> {
  let query = supabase.from('colors').select('finish');
  if (shopSlug) query = query.eq('shop_slug', shopSlug);
  const { data, error } = await query;
  if (error) throw error;

  const standardFinishes = ['Basic', 'Galaxy', 'Matte', 'Satin', 'Silk', 'Solid', 'Translucent'];
  const existingFinishes = Array.isArray(data)
    ? data.map((item) => (item as { finish: string }).finish).filter((f) => f && f.trim() !== '')
    : [];
  return [...new Set([...standardFinishes, ...existingFinishes])].sort();
}

/** Ported 1:1 from hub.html fetchForAdmin(). */
export async function getColors(supabase: SupabaseClient, shopSlug: string | null): Promise<ColorItem[]> {
  let query = supabase.from('colors').select('*');
  if (shopSlug) query = query.eq('shop_slug', shopSlug);
  const { data, error } = await query;
  if (error) throw error;
  return Array.isArray(data) ? (data as ColorItem[]) : [];
}

export type NewColorPayload = {
  color: string;
  finish: string;
  description: string;
  colorHex1: string;
  colorHex2: string;
  colorHex3: string;
  inStock: boolean;
  shop_slug: string | null;
};

export async function insertColor(supabase: SupabaseClient, payload: NewColorPayload) {
  const { error } = await supabase.from('colors').insert([payload]);
  if (error) throw error;
}

export async function updateColorStock(supabase: SupabaseClient, id: number | string, inStock: boolean) {
  const { error } = await supabase.from('colors').update({ inStock }).eq('id', id);
  if (error) throw error;
}

export async function updateColorField(
  supabase: SupabaseClient,
  id: number | string,
  field: string,
  value: string
) {
  const { error } = await supabase
    .from('colors')
    .update({ [field]: value })
    .eq('id', id);
  if (error) throw error;
}

export async function deleteColor(supabase: SupabaseClient, id: number | string) {
  const { error } = await supabase.from('colors').delete().eq('id', id);
  if (error) throw error;
}
