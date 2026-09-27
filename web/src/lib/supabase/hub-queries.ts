/**
 * lib/supabase/hub-queries.ts — Admin Hub Data Access Layer
 * ─────────────────────────────────────────────────────────────────────────────
 * Typed query functions backing the Admin Hub dashboard (components/hub/*).
 * All calls go through the shared browser Supabase client and reuse the
 * SACRED, IMMUTABLE table/column names exactly as-is from the legacy
 * hub.html implementation — see Project_Log.md "Database Sacrosanctity".
 * No schema changes. No renamed/dropped columns.
 *
 * Queue write functions (updateJobStatus / updateJobFields / batchDeleteJobs)
 * require a shopSlug parameter and enforce a `.eq('shop_slug', shopSlug)`
 * filter alongside the id filter, so a caller can never mutate another
 * shop's print_jobs rows even if an id/array of ids from another shop were
 * somehow supplied. Callers are the Route Handlers under app/api/hub/queue/*,
 * which derive shopSlug from the verified session cookie — never from
 * client-supplied input.
 *
 * Colors write functions (updateColorFields / updateColorStock /
 * updateColorField / deleteColor) follow the exact same pattern and require
 * a shopSlug parameter enforcing a `.eq('shop_slug', shopSlug)` filter
 * alongside the id filter. Callers are the Route Handlers under
 * app/api/hub/colors/*, which derive shopSlug from the verified session
 * cookie — never from client-supplied input.
 *
 * Notification settings functions (getShopNotificationSettings /
 * updateShopNotificationSettings) added 2026-09-26 as part of the
 * multi-tenant notifications redesign (see
 * claude/notifications-redesign-plan.md in the Claude Project) — same
 * shop_slug-scoped pattern as the passcode functions below.
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

export async function updateJobStatus(
  supabase: SupabaseClient,
  id: string,
  status: string,
  shopSlug: string
): Promise<PrintJob[]> {
  const { data, error } = await supabase
    .from('print_jobs')
    .update({ status })
    .eq('id', id)
    .eq('shop_slug', shopSlug)
    .select();
  if (error) throw error;
  return Array.isArray(data) ? (data as PrintJob[]) : [];
}

export async function updateJobFields(
  supabase: SupabaseClient,
  id: string,
  fields: Record<string, string>,
  shopSlug: string
): Promise<PrintJob[]> {
  const { data, error } = await supabase
    .from('print_jobs')
    .update(fields)
    .eq('id', id)
    .eq('shop_slug', shopSlug)
    .select();
  if (error) throw error;
  return Array.isArray(data) ? (data as PrintJob[]) : [];
}

export async function batchDeleteJobs(
  supabase: SupabaseClient,
  ids: string[],
  shopSlug: string
): Promise<PrintJob[]> {
  const { data, error } = await supabase
    .from('print_jobs')
    .delete()
    .in('id', ids)
    .eq('shop_slug', shopSlug)
    .select();
  if (error) throw error;
  return Array.isArray(data) ? (data as PrintJob[]) : [];
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

/** Looks up passcode_hash for a single shop by shop_slug — used by the change-passcode Route Handler. */
export async function getShopPasscodeHash(
  supabase: SupabaseClient,
  shopSlug: string
): Promise<string | null> {
  const { data, error } = await supabase
    .from('shops')
    .select('passcode_hash')
    .eq('shop_slug', shopSlug)
    .maybeSingle();

  if (error) throw error;
  return data?.passcode_hash ?? null;
}

/** Writes a new passcode_hash for a single shop by shop_slug — used by the change-passcode Route Handler. */
export async function updateShopPasscodeHash(
  supabase: SupabaseClient,
  shopSlug: string,
  passcodeHash: string
): Promise<void> {
  const { error } = await supabase
    .from('shops')
    .update({ passcode_hash: passcodeHash })
    .eq('shop_slug', shopSlug);

  if (error) throw error;
}

/** Looks up the current shop_name for a single shop by shop_slug — used by the Hub shop-profile Route Handler. */
export async function getShopName(
  supabase: SupabaseClient,
  shopSlug: string
): Promise<string | null> {
  const { data, error } = await supabase
    .from('shops')
    .select('shop_name')
    .eq('shop_slug', shopSlug)
    .maybeSingle();

  if (error) throw error;
  return data?.shop_name ?? null;
}

/**
 * Writes a new shop_name for a single shop by shop_slug — used by the Hub
 * shop-profile Route Handler, both for the editable-anytime settings field
 * and the mandatory first-login prompt (see ShopNameModal.tsx).
 */
export async function updateShopName(
  supabase: SupabaseClient,
  shopSlug: string,
  shopName: string
): Promise<void> {
  const { error } = await supabase
    .from('shops')
    .update({ shop_name: shopName })
    .eq('shop_slug', shopSlug);

  if (error) throw error;
}

export type ShopNotificationSettings = {
  notification_email: string | null;
  discord_webhook_url: string | null;
};

/**
 * Looks up notification settings for a single shop by shop_slug — used by
 * the notify-request Route Handler (to decide where to send a print-request
 * alert) and the Hub notification-settings Route Handler (to populate the
 * settings modal). Returns null only if no row matches shopSlug at all;
 * either column individually may still be null (channel not configured).
 */
export async function getShopNotificationSettings(
  supabase: SupabaseClient,
  shopSlug: string
): Promise<ShopNotificationSettings | null> {
  const { data, error } = await supabase
    .from('shops')
    .select('notification_email, discord_webhook_url')
    .eq('shop_slug', shopSlug)
    .maybeSingle();

  if (error) throw error;
  return data ? (data as ShopNotificationSettings) : null;
}

/**
 * Writes new notification settings for a single shop by shop_slug — used by
 * the Hub notification-settings Route Handler. `fields` may contain either
 * or both keys; an explicit `null` clears that channel (e.g. removing a
 * Discord webhook without touching the email address).
 */
export async function updateShopNotificationSettings(
  supabase: SupabaseClient,
  shopSlug: string,
  fields: Partial<ShopNotificationSettings>
): Promise<void> {
  const { error } = await supabase
    .from('shops')
    .update(fields)
    .eq('shop_slug', shopSlug);

  if (error) throw error;
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

export async function insertColor(supabase: SupabaseClient, payload: NewColorPayload): Promise<ColorItem> {
  const { data, error } = await supabase.from('colors').insert([payload]).select().single();
  if (error) throw error;
  return data as ColorItem;
}

export async function updateColorStock(
  supabase: SupabaseClient,
  id: number | string,
  inStock: boolean,
  shopSlug: string
) {
  const { error } = await supabase
    .from('colors')
    .update({ inStock })
    .eq('id', id)
    .eq('shop_slug', shopSlug);
  if (error) throw error;
}

export async function updateColorField(
  supabase: SupabaseClient,
  id: number | string,
  field: string,
  value: string,
  shopSlug: string
) {
  const { error } = await supabase
    .from('colors')
    .update({ [field]: value })
    .eq('id', id)
    .eq('shop_slug', shopSlug);
  if (error) throw error;
}

/**
 * Builds one merged object and applies it via one atomic .update() call —
 * the function the app/api/hub/colors/[id] Route Handler actually calls.
 * `fields` may contain any combination of the three Hub-editable columns;
 * whichever keys are present are written in a single request. Empty array
 * = no row matched the given id + shop_slug (wrong id or wrong shop).
 */
export async function updateColorFields(
  supabase: SupabaseClient,
  id: number | string,
  fields: Partial<{ inStock: boolean; color: string; finish: string }>,
  shopSlug: string
): Promise<ColorItem[]> {
  const { data, error } = await supabase
    .from('colors')
    .update(fields)
    .eq('id', id)
    .eq('shop_slug', shopSlug)
    .select();
  if (error) throw error;
  return Array.isArray(data) ? (data as ColorItem[]) : [];
}

export async function deleteColor(
  supabase: SupabaseClient,
  id: number | string,
  shopSlug: string
): Promise<ColorItem[]> {
  const { data, error } = await supabase
    .from('colors')
    .delete()
    .eq('id', id)
    .eq('shop_slug', shopSlug)
    .select();
  if (error) throw error;
  return Array.isArray(data) ? (data as ColorItem[]) : [];
}
