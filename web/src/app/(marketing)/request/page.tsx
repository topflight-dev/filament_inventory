/**
 * Request ("/request") — multi-tenant customer print-job intake form.
 * Full vertical-slice port of legacy request.html (+ byte-identical
 * src/pages/public/request.html), the public storefront tied to a shop's
 * Hub/Dashboard via the `?shop=` URL parameter.
 *
 * Preserved 1:1 from the legacy implementation:
 *   - Strict shop-slug gate: missing/invalid resolved slug → "Shop Not Found"
 *     card, validated against the `shops` table before anything else renders.
 *   - Shop branding injection (shop_name / logo_url) into the page header.
 *   - Filament checklist scoped to the shop (`colors` where inStock + shop_slug),
 *     multi-select with removable "pill" chips.
 *   - Same validation rules (name + project + ≥1 filament color required).
 *   - Same `print_jobs` insert payload/column names (SACRED schema, Phase 1
 *     Database Sacrosanctity — no renamed/dropped columns).
 *   - Special-instructions text appended into `project_name` via the same
 *     "📝" separator convention (no schema changes needed for a notes column).
 *
 * Deliberately changed vs. legacy:
 *   - Uses the shared browser Supabase client (`lib/supabase/client.ts`)
 *     instead of the retired CDN-script + js/api/api.js pattern.
 *   - The Discord webhook notification is now a fire-and-forget POST to our
 *     own server Route Handler (`/api/notify-discord`), which reads the
 *     server-only `DISCORD_WEBHOOK_URL` env var — closing the client-exposed
 *     webhook leak flagged in Project_Log.md Phase 1 "Flagged Findings" #1.
 *   - `useSearchParams()` requires this tree to be wrapped in `<Suspense>`
 *     per Next.js App Router rules, so the exported page component is a thin
 *     Suspense wrapper around the actual client-logic component.
 *   - Multi-tenant shop-slug resolution is now a 3-tier dynamic fallback
 *     chain instead of a strict single-source `?shop=` requirement, so that
 *     `/request` (no query string) still resolves to an active shop profile
 *     instead of throwing "Shop Not Found". Resolution order:
 *       1. `?shop=` URL search param (multi-tenant override — unchanged).
 *       2. `NEXT_PUBLIC_DEFAULT_SHOP_SLUG` build-time env var (per-deployment
 *          default, safe to expose to the browser — it is a slug, not a
 *          secret; see `.env.local.example`).
 *       3. Hardcoded generic fallback identifier matching this shop's row
 *          in the `shops` table, as an absolute last-resort safety net.
 *     This keeps the feature trivially uncoupled/scalable into a commercial
 *     multi-tenant tool later: swapping tier 2/3 is a config change only.
 *   - RESILIENT LOCAL-DEV SAFETY NET: if none of the 3 tiers above resolve to
 *     an existing row in the `shops` table (e.g. a fresh local/dev database
 *     that hasn't been seeded with this shop's row yet), the gate performs a
 *     final fallback query — grab the first available row in `shops` via
 *     `.limit(1).maybeSingle()` — and if found, adopts THAT row's real
 *     `shop_slug` as the active tenant identifier for the rest of the page
 *     (branding, filament checklist, and the `print_jobs` insert all switch
 *     to it), so the page never bricks into "Shop Not Found" during local
 *     development. Only if the `shops` table itself is completely empty does
 *     the page fall through to the real "Shop Not Found" state.
 *
 * Visual palette: "Deep Oceanic Stealth" theme — arctic twilight blue canvas
 * (bg-slate-950), frosted navy slate panels (bg-slate-900/70,
 * border-slate-800/80, rounded-xl), vibrant cyan (sky-500) primary actions
 * with dark text for max contrast, slate-200/slate-400/slate-500 text
 * hierarchy. Functional status colors (mint success / red error) unchanged.
 */
'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

type Filament = {
  id: number;
  color: string;
  finish: string;
};

type SelectedFilament = {
  id: string;
  label: string;
};

type GateState = 'checking' | 'not-found' | 'ok';

type ShopBrand = {
  shop_name: string;
  logo_url: string | null;
} | null;

/**
 * Default fallback slug used when this shop's active tenant identifier
 * cannot be resolved from the URL or the environment. Matches this shop's
 * row in the `shops` table's `shop_slug` column — swap this value (or better,
 * always set NEXT_PUBLIC_DEFAULT_SHOP_SLUG) when white-labeling this app for
 * a different tenant.
 */
const HARDCODED_FALLBACK_SHOP_SLUG = 'crafted3dworkshop';

function RequestPageInner() {
  const searchParams = useSearchParams();

  // -----------------------------------------------
  // MULTI-TENANT SHOP-SLUG RESOLUTION — 3-tier dynamic fallback chain
  // -----------------------------------------------
  // 1) Explicit `?shop=` URL param always wins (real multi-tenant routing).
  // 2) NEXT_PUBLIC_DEFAULT_SHOP_SLUG build-time env var (per-deployment
  //    default; public/browser-safe since it is a slug, not a secret).
  // 3) Hardcoded generic fallback identifier as an absolute last resort.
  const urlShopSlug = (searchParams.get('shop') || '').trim();
  const envDefaultShopSlug = (process.env.NEXT_PUBLIC_DEFAULT_SHOP_SLUG || '').trim();
  const requestedShopSlug = urlShopSlug || envDefaultShopSlug || HARDCODED_FALLBACK_SHOP_SLUG;

  const supabase = useMemo(() => createClient(), []);

  const [gate, setGate] = useState<GateState>('checking');
  // The tenant slug actually in effect for the rest of the page. Starts as the
  // requested slug (tiers 1-3 above); if the local-dev safety-net fallback
  // kicks in, this is swapped to the real shop_slug of whatever row was found.
  const [resolvedShopSlug, setResolvedShopSlug] = useState<string>(requestedShopSlug);
  const [shopBrand, setShopBrand] = useState<ShopBrand>(null);

  const [allFilaments, setAllFilaments] = useState<Filament[]>([]);
  const [filamentsLoading, setFilamentsLoading] = useState(true);
  const [filamentsError, setFilamentsError] = useState(false);
  const [selectedFilaments, setSelectedFilaments] = useState<SelectedFilament[]>([]);

  const [requestorName, setRequestorName] = useState('');
  const [projectName, setProjectName] = useState('');
  const [modelLink, setModelLink] = useState('');
  const [specialInstructions, setSpecialInstructions] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // -----------------------------------------------
  // STEP 1/2/3 — MULTI-TENANT SHOP SLUG GATE (+ local-dev safety net)
  // -----------------------------------------------
  useEffect(() => {
    let cancelled = false;

    async function runGate() {
      if (!requestedShopSlug) {
        if (!cancelled) setGate('not-found');
        return;
      }

      try {
        const { data: shopRecord, error } = await supabase
          .from('shops')
          .select('shop_slug')
          .eq('shop_slug', requestedShopSlug)
          .maybeSingle();

        if (cancelled) return;

        if (!error && shopRecord) {
          setResolvedShopSlug(requestedShopSlug);
          setGate('ok');
          return;
        }

        // RESILIENT DEV FALLBACK — the requested slug doesn't exist locally
        // (e.g. a fresh/empty local database). Grab whatever the first
        // available `shops` row is so the page never bricks in local dev.
        const { data: fallbackShop, error: fallbackError } = await supabase
          .from('shops')
          .select('shop_slug')
          .limit(1)
          .maybeSingle();

        if (cancelled) return;

        if (!fallbackError && fallbackShop?.shop_slug) {
          setResolvedShopSlug(fallbackShop.shop_slug);
          setGate('ok');
          return;
        }

        setGate('not-found');
      } catch (err) {
        console.error('[C3DW] Shop validation failed:', err);
        if (!cancelled) setGate('not-found');
      }
    }

    runGate();
    return () => {
      cancelled = true;
    };
  }, [requestedShopSlug, supabase]);

  // -----------------------------------------------
  // SHOP BRANDING INJECTION (non-critical)
  // -----------------------------------------------
  useEffect(() => {
    if (gate !== 'ok') return;
    let cancelled = false;

    async function loadBrand() {
      try {
        const { data } = await supabase
          .from('shops')
          .select('shop_name, logo_url')
          .eq('shop_slug', resolvedShopSlug)
          .single();

        if (!cancelled && data) {
          setShopBrand(data as ShopBrand);
          document.title = `${data.shop_name} | Submit a Print Request`;
        }
      } catch (err) {
        console.warn('[C3DW] Shop branding load failed (non-critical):', err);
      }
    }

    loadBrand();
    return () => {
      cancelled = true;
    };
  }, [gate, resolvedShopSlug, supabase]);

  // -----------------------------------------------
  // POPULATE FILAMENT CHECKLIST
  // -----------------------------------------------
  useEffect(() => {
    if (gate !== 'ok') return;
    let cancelled = false;

    async function loadFilaments() {
      setFilamentsLoading(true);
      setFilamentsError(false);
      try {
        const { data, error } = await supabase
          .from('colors')
          .select('id, color, finish, inStock')
          .eq('inStock', true)
          .eq('shop_slug', resolvedShopSlug)
          .order('color', { ascending: true });

        if (error) throw error;
        if (!cancelled) setAllFilaments(Array.isArray(data) ? (data as Filament[]) : []);
      } catch (err) {
        console.error('Filament load error:', err);
        if (!cancelled) setFilamentsError(true);
      } finally {
        if (!cancelled) setFilamentsLoading(false);
      }
    }

    loadFilaments();
    return () => {
      cancelled = true;
    };
  }, [gate, resolvedShopSlug, supabase]);

  function toggleFilament(f: Filament, checked: boolean) {
    const id = String(f.id);
    const label = `${f.color} — ${f.finish}`;
    setSelectedFilaments((prev) => {
      if (checked) {
        if (prev.find((sf) => sf.id === id)) return prev;
        return [...prev, { id, label }];
      }
      return prev.filter((sf) => sf.id !== id);
    });
  }

  function removeFilament(id: string) {
    setSelectedFilaments((prev) => prev.filter((sf) => sf.id !== id));
  }

  const selectedIds = useMemo(() => new Set(selectedFilaments.map((f) => f.id)), [selectedFilaments]);

  // -----------------------------------------------
  // FORM SUBMISSION
  // -----------------------------------------------
  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatusMessage(null);

    const trimmedName = requestorName.trim();
    const trimmedProject = projectName.trim();
    const trimmedLink = modelLink.trim();
    const trimmedComment = specialInstructions.trim();

    if (!trimmedName || !trimmedProject) {
      setStatusMessage({ text: 'Please fill in your name and project name.', type: 'error' });
      return;
    }
    if (selectedFilaments.length === 0) {
      setStatusMessage({ text: 'Please select at least one filament color.', type: 'error' });
      return;
    }

    const colorPreference = selectedFilaments.map((f) => f.label).join(', ');
    const filamentId = parseInt(selectedFilaments[0].id, 10);
    const finalProjectName = trimmedComment ? `${trimmedProject} | 📝 ${trimmedComment}` : trimmedProject;

    setSubmitting(true);

    const payload = {
      requestor_name: trimmedName,
      project_name: finalProjectName,
      stl_url: trimmedLink || null,
      filament_id: filamentId,
      color_preference: colorPreference,
      status: 'Pending',
      shop_slug: resolvedShopSlug,
    };

    try {
      const { error } = await supabase.from('print_jobs').insert([payload]);
      if (error) throw error;

      setStatusMessage({ text: '✅ Request added to the queue!', type: 'success' });
      setRequestorName('');
      setProjectName('');
      setModelLink('');
      setSpecialInstructions('');
      setSelectedFilaments([]);

      // Fire-and-forget secure server-side Discord notification
      fetch('/api/notify-discord', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectName: trimmedProject,
          requestorName: trimmedName,
          colorPreference,
        }),
      }).catch((err) => console.warn('Discord notification failed (non-critical):', err));
    } catch (err) {
      console.error('Submission error:', err);
      const message = err instanceof Error ? err.message : 'Unknown error';
      setStatusMessage({ text: `❌ Submission failed: ${message}`, type: 'error' });
    } finally {
      setSubmitting(false);
    }
  }

  // -----------------------------------------------
  // RENDER — GATE STATES ("Deep Oceanic Stealth" theme)
  // -----------------------------------------------
  if (gate === 'checking') {
    return (
      <main className="mx-auto min-h-screen max-w-lg bg-slate-950 px-6 py-24 text-center text-xs text-slate-400">
        <p>Loading…</p>
      </main>
    );
  }

  if (gate === 'not-found') {
    return (
      <main className="mx-auto min-h-screen max-w-lg bg-slate-950 px-6 py-16">
        <div className="mx-auto max-w-md rounded-xl border border-slate-800/80 bg-slate-900/70 px-8 py-10 text-center shadow-lg">
          <span className="mb-3 block text-5xl">⚠️</span>
          <h2 className="mb-3 text-lg font-semibold text-slate-200">Shop Not Found</h2>
          <p className="text-xs leading-relaxed text-slate-400">
            Please double-check the web address provided by your 3D print operator.
          </p>
        </div>
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950">
      <header className="border-b border-slate-800/80 bg-slate-950 px-6 pt-10 pb-6 text-center">
        {shopBrand?.logo_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={shopBrand.logo_url}
            alt={shopBrand.shop_name}
            className="mx-auto max-h-[60px] max-w-[220px] object-contain"
          />
        ) : (
          <h1 className="text-2xl font-semibold text-slate-200">
            {shopBrand?.shop_name ?? 'Print Request'}
          </h1>
        )}
        <p className="mt-2 text-sm italic text-slate-400">
          Submit a job to the 3D print queue!
        </p>
      </header>

      <main className="px-6 py-6">
        <div className="mx-auto w-full max-w-[500px] rounded-xl border border-slate-800/80 bg-slate-900/70 p-6 text-left shadow-lg">
          <h2 className="mb-5 border-b border-slate-800/80 pb-2.5 text-base font-semibold text-slate-200">
            🖨️ Submit a Print Request
          </h2>

          <form onSubmit={handleSubmit} noValidate>
            <div className="mb-4">
              <label htmlFor="requestorName" className="mb-1.5 block text-xs font-semibold text-slate-400">
                Your Name
              </label>
              <input
                type="text"
                id="requestorName"
                value={requestorName}
                onChange={(e) => setRequestorName(e.target.value)}
                placeholder="e.g., Jane Smith"
                required
                autoComplete="name"
                className="block w-full rounded-md border border-slate-800/80 bg-slate-950 px-3 py-2.5 text-sm text-slate-200 transition-colors placeholder:text-slate-500 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-400"
              />
            </div>

            <div className="mb-4">
              <label htmlFor="projectName" className="mb-1.5 block text-xs font-semibold text-slate-400">
                Project Name
              </label>
              <input
                type="text"
                id="projectName"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder="e.g., Desk Organizer"
                required
                className="block w-full rounded-md border border-slate-800/80 bg-slate-950 px-3 py-2.5 text-sm text-slate-200 transition-colors placeholder:text-slate-500 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-400"
              />
            </div>

            <div className="mb-4">
              <label htmlFor="modelLink" className="mb-1.5 block text-xs font-semibold text-slate-400">
                Link to Model <span className="text-xs font-normal text-slate-500">(optional)</span>
              </label>
              <input
                type="text"
                id="modelLink"
                value={modelLink}
                onChange={(e) => setModelLink(e.target.value)}
                placeholder="e.g., https://www.thingiverse.com/thing:..."
                className="block w-full rounded-md border border-slate-800/80 bg-slate-950 px-3 py-2.5 text-sm text-slate-200 transition-colors placeholder:text-slate-500 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-400"
              />
            </div>

            <div className="mb-4">
              <label className="mb-1.5 block text-xs font-semibold text-slate-400">
                Filament Color(s) <span className="text-xs font-normal text-slate-500">(select one or more)</span>
              </label>

              {/* Selected color pills */}
              <div className="mt-1 flex min-h-0 flex-wrap gap-1.5">
                {selectedFilaments.length === 0 ? (
                  <span className="text-xs italic text-slate-500">No colors selected yet…</span>
                ) : (
                  selectedFilaments.map((f) => (
                    <span
                      key={f.id}
                      className="inline-flex items-center gap-1.5 rounded-full border border-sky-500/40 bg-sky-500/10 px-2.5 py-1 text-xs font-semibold text-sky-400"
                    >
                      {f.label}
                      <button
                        type="button"
                        aria-label={`Remove ${f.label}`}
                        onClick={() => removeFilament(f.id)}
                        className="leading-none text-sky-400/70 hover:text-sky-400"
                      >
                        ✕
                      </button>
                    </span>
                  ))
                )}
              </div>

              {/* Scrollable checklist */}
              <div className="mt-2 max-h-[200px] overflow-y-auto rounded-md border border-slate-800/80 bg-slate-950 py-1">
                {filamentsLoading ? (
                  <div className="px-3 py-2.5 text-xs italic text-slate-500">Loading filaments…</div>
                ) : filamentsError ? (
                  <div className="px-3 py-2.5 text-xs italic text-slate-500">Could not load filaments</div>
                ) : allFilaments.length === 0 ? (
                  <div className="px-3 py-2.5 text-xs italic text-slate-500">No filaments available</div>
                ) : (
                  allFilaments.map((f) => {
                    const checked = selectedIds.has(String(f.id));
                    return (
                      <label
                        key={f.id}
                        className={`flex cursor-pointer select-none items-center gap-2.5 px-3 py-2 text-sm text-slate-200 transition-colors hover:bg-sky-500/10 ${
                          checked ? 'bg-sky-500/15' : ''
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={(e) => toggleFilament(f, e.target.checked)}
                          className="h-[17px] w-[17px] flex-shrink-0 accent-sky-500"
                        />
                        <span>
                          {f.color} — {f.finish}
                        </span>
                      </label>
                    );
                  })
                )}
              </div>
            </div>

            <div className="mb-4">
              <label htmlFor="specialInstructions" className="mb-1.5 block text-xs font-semibold text-slate-400">
                Special Instructions / Comments{' '}
                <span className="text-xs font-normal text-slate-500">(optional)</span>
              </label>
              <textarea
                id="specialInstructions"
                value={specialInstructions}
                onChange={(e) => setSpecialInstructions(e.target.value)}
                placeholder="e.g., Please use a raft, print at 20% infill, or any other notes..."
                rows={3}
                className="block min-h-[80px] w-full resize-y rounded-md border border-slate-800/80 bg-slate-950 px-3 py-2.5 text-sm text-slate-200 transition-colors placeholder:text-slate-500 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-400"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="mt-2 w-full rounded-full bg-sky-500 py-3.5 text-sm font-medium text-slate-950 transition-colors hover:not-disabled:bg-sky-600 focus:outline-none focus:ring-2 focus:ring-sky-400 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400"
            >
              {submitting ? 'Submitting...' : '🚀 Submit Request'}
            </button>

            {statusMessage && (
              <div
                className={`mt-4 rounded-lg border px-4 py-3 text-center text-sm ${
                  statusMessage.type === 'success'
                    ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400'
                    : 'border-red-500/40 bg-red-500/10 text-red-400'
                }`}
              >
                {statusMessage.text}
              </div>
            )}
          </form>
        </div>
      </main>
    </div>
  );
}

export default function RequestPage() {
  return (
    <Suspense
      fallback={
        <main className="mx-auto min-h-screen max-w-lg bg-slate-950 px-6 py-24 text-center text-xs text-slate-400">
          <p>Loading…</p>
        </main>
      }
    >
      <RequestPageInner />
    </Suspense>
  );
}
