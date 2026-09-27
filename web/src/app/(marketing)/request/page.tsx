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
 *   - The notification fire-and-forget POST now goes to `/api/notify-request`
 *     (not the retired `/api/notify-discord`), passing `shopSlug` so the
 *     server can look up THAT shop's own notification_email /
 *     discord_webhook_url — see claude/notifications-redesign-plan.md in the
 *     Claude Project. The server never trusts a webhook URL or address from
 *     the client; it derives everything from `shops` via the service client.
 *   - `useSearchParams()` requires this tree to be wrapped in `<Suspense>`
 *     per Next.js App Router rules, so the exported page component is a thin
 *     Suspense wrapper around the actual client-logic component.
 *   - Multi-tenant shop-slug resolution is a 3-tier dynamic fallback chain
 *     instead of a strict single-source `?shop=` requirement, so that
 *     `/request` (no query string) still resolves to an active shop profile
 *     instead of throwing "Shop Not Found". Resolution order:
 *       1. `?shop=` URL search param (multi-tenant override — this is the
 *          real per-shop routing mechanism; see the Hub's "Share Your
 *          Link" modal, which hands each shop owner their own exact,
 *          session-derived link built from this param).
 *       2. `NEXT_PUBLIC_DEFAULT_SHOP_SLUG` build-time env var (per-deployment
 *          default, safe to expose to the browser — it is a slug, not a
 *          secret; see `.env.local.example`).
 *       3. Hardcoded generic fallback identifier matching this shop's row
 *          in the `shops` table, as an absolute last-resort safety net.
 *     This keeps the feature trivially uncoupled/scalable into a commercial
 *     multi-tenant tool later: swapping tier 2/3 is a config change only.
 *   - FIXED 2026-09-26: tiers 2/3 previously pointed at 'crafted3dworkshop',
 *     which does not match any real `shops.shop_slug` row (the real one is
 *     'crafted3d') — every request with a missing/wrong slug was silently
 *     falling through to the dev-only safety net below and landing on
 *     whatever shop happened to be first in the table. Both now point at the
 *     correct slug. See claude/notifications-redesign-plan.md (Claude
 *     Project) for the full incident write-up.
 *   - RESILIENT LOCAL-DEV SAFETY NET (local development only, see
 *     `process.env.NODE_ENV` guard below): if none of the 3 tiers above
 *     resolve to an existing row in the `shops` table (e.g. a fresh
 *     local/dev database that hasn't been seeded with this shop's row yet),
 *     the gate performs a final fallback query — grab the first available
 *     row in `shops` via `.limit(1).maybeSingle()` — and if found, adopts
 *     THAT row's real `shop_slug` as the active tenant identifier for the
 *     rest of the page, so the page never bricks into "Shop Not Found"
 *     during local development.
 *   - THIS SAFETY NET NO LONGER RUNS IN PRODUCTION. It used to, and that was
 *     a real multi-tenant correctness bug: a customer opening a bad or stale
 *     link would be silently routed into an arbitrary shop's queue instead
 *     of seeing an honest error, meaning that shop would get notified about
 *     a request that was never meant for it. In production, an unmatched
 *     slug now always shows "Shop Not Found" — a shop's link either
 *     unambiguously resolves to that shop, or it visibly fails. Only local
 *     development gets the convenience fallback.
 *
 * UPDATED 2026-09-26 (icon pass): emoji icons replaced with lucide-react.
 *
 * UPDATED 2026-09-26 (visual redesign, phase 2 — see
 * claude/dashboard-domain-split-plan.md "Design pass" section): retired the
 * dark "Deep Oceanic Stealth" theme for the neutral light SaaS theme shared
 * across every Hub/Request file (zinc neutrals + one indigo accent) — see
 * HubShell.tsx's header comment for the full reasoning. Functional status
 * colors (mint success / red error) re-tuned for a light background but
 * otherwise unchanged in meaning.
 *
 * UPDATED 2026-09-26 (phase 3): the filament picker was a plain scrollable
 * checkbox list — functional, but it read like a leftover HTML form rather
 * than the rest of this page. Replaced with a searchable chip-select: a
 * search box filters the available colors, and each color is a clickable
 * chip that toggles selected/unselected in place (no checkbox required).
 * The already-selected pills row above it is unchanged — it's still the
 * fastest way to see (and remove) a full selection when a search filters
 * a chip out of view below.
 */
'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { AlertTriangle, Check, CheckCircle2, Loader2, Printer, Search, Send, X, XCircle } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import Input from '@/components/ui/Input';
import Skeleton from '@/components/ui/Skeleton';

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
const HARDCODED_FALLBACK_SHOP_SLUG = 'crafted3d';

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
  const [filamentSearch, setFilamentSearch] = useState('');

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

        // RESILIENT DEV FALLBACK — local development ONLY. Production must
        // never silently guess a different shop when the requested slug
        // doesn't match — see the file header for why (this was a live
        // multi-tenant correctness bug until 2026-09-26).
        if (process.env.NODE_ENV !== 'production') {
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

  const filteredFilaments = useMemo(() => {
    const q = filamentSearch.trim().toLowerCase();
    if (!q) return allFilaments;
    return allFilaments.filter(
      (f) => f.color.toLowerCase().includes(q) || f.finish.toLowerCase().includes(q)
    );
  }, [allFilaments, filamentSearch]);

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

    try {
      // The print_jobs insert now happens server-side (see
      // /api/print-request). An RLS audit (2026-09-27) found the anon
      // client's direct insert into print_jobs was fully unrestricted at the
      // database level (any shop_slug, no rate limit) — this route does the
      // same insert via the service-role client, plus a shop-existence
      // check and a basic per-shop rate limit. The anon INSERT grant on
      // print_jobs has been revoked in Supabase, so a direct client-side
      // insert can no longer succeed at all.
      const res = await fetch('/api/print-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shopSlug: resolvedShopSlug,
          requestorName: trimmedName,
          projectName: finalProjectName,
          stlUrl: trimmedLink || null,
          filamentId,
          colorPreference,
        }),
      });

      if (!res.ok) {
        const errorBody = await res.json().catch(() => null);
        throw new Error(errorBody?.error || 'Submission failed');
      }

      setStatusMessage({ text: 'Request added to the queue!', type: 'success' });
      setRequestorName('');
      setProjectName('');
      setModelLink('');
      setSpecialInstructions('');
      setSelectedFilaments([]);

      // Fire-and-forget secure server-side notification (email and/or Discord,
      // per-shop — see /api/notify-request). shopSlug lets the server look up
      // THIS shop's own settings; the server never trusts client-supplied
      // contact info.
      fetch('/api/notify-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shopSlug: resolvedShopSlug,
          projectName: trimmedProject,
          requestorName: trimmedName,
          colorPreference,
        }),
      }).catch((err) => console.warn('Print-request notification failed (non-critical):', err));
    } catch (err) {
      console.error('Submission error:', err);
      const message = err instanceof Error ? err.message : 'Unknown error';
      setStatusMessage({ text: `Submission failed: ${message}`, type: 'error' });
    } finally {
      setSubmitting(false);
    }
  }

  // -----------------------------------------------
  // RENDER — GATE STATES (neutral light SaaS theme)
  // -----------------------------------------------
  if (gate === 'checking') {
    return (
      <main className="mx-auto flex min-h-screen max-w-lg flex-col items-center justify-center gap-3 bg-zinc-50 px-6 py-24 text-center text-xs text-zinc-400">
        <Loader2 className="h-6 w-6 animate-spin text-zinc-300" />
        <p>Loading…</p>
      </main>
    );
  }

  if (gate === 'not-found') {
    return (
      <main className="mx-auto min-h-screen max-w-lg bg-zinc-50 px-6 py-16">
        <div className="mx-auto max-w-md rounded-xl border border-zinc-200 bg-white px-8 py-10 text-center shadow-sm">
          <AlertTriangle className="mx-auto mb-3 h-11 w-11 text-amber-500" strokeWidth={1.75} />
          <h2 className="mb-3 text-lg font-semibold text-zinc-900">Shop Not Found</h2>
          <p className="text-xs leading-relaxed text-zinc-500">
            Please double-check the web address provided by your 3D print operator.
          </p>
        </div>
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50">
      <header className="border-b border-zinc-200 bg-white px-6 pt-10 pb-6 text-center">
        {shopBrand?.logo_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={shopBrand.logo_url}
            alt={shopBrand.shop_name}
            className="mx-auto max-h-[60px] max-w-[220px] object-contain"
          />
        ) : (
          <h1 className="text-2xl font-semibold text-zinc-900">
            {shopBrand?.shop_name ?? 'Print Request'}
          </h1>
        )}
        <p className="mt-2 text-sm italic text-zinc-500">
          Submit a job to the 3D print queue!
        </p>
      </header>

      <main className="px-6 py-6">
        <div className="mx-auto w-full max-w-[500px] rounded-xl border border-zinc-200 bg-white p-6 text-left shadow-sm">
          <h2 className="mb-5 flex items-center gap-2 border-b border-zinc-200 pb-2.5 text-base font-semibold text-zinc-900">
            <Printer className="h-[18px] w-[18px] text-indigo-600" />
            Submit a Print Request
          </h2>

          <form onSubmit={handleSubmit} noValidate>
            <div className="mb-4">
              <label htmlFor="requestorName" className="mb-1.5 block text-xs font-semibold text-zinc-500">
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
                className="block w-full rounded-md border border-zinc-300 bg-white px-3 py-2.5 text-sm text-zinc-900 transition-colors placeholder:text-zinc-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
              />
            </div>

            <div className="mb-4">
              <label htmlFor="projectName" className="mb-1.5 block text-xs font-semibold text-zinc-500">
                Project Name
              </label>
              <input
                type="text"
                id="projectName"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder="e.g., Desk Organizer"
                required
                className="block w-full rounded-md border border-zinc-300 bg-white px-3 py-2.5 text-sm text-zinc-900 transition-colors placeholder:text-zinc-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
              />
            </div>

            <div className="mb-4">
              <label htmlFor="modelLink" className="mb-1.5 block text-xs font-semibold text-zinc-500">
                Link to Model <span className="text-xs font-normal text-zinc-400">(optional)</span>
              </label>
              <input
                type="text"
                id="modelLink"
                value={modelLink}
                onChange={(e) => setModelLink(e.target.value)}
                placeholder="e.g., https://www.thingiverse.com/thing:..."
                className="block w-full rounded-md border border-zinc-300 bg-white px-3 py-2.5 text-sm text-zinc-900 transition-colors placeholder:text-zinc-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
              />
            </div>

            <div className="mb-4">
              <label className="mb-1.5 block text-xs font-semibold text-zinc-500">
                Filament Color(s) <span className="text-xs font-normal text-zinc-400">(select one or more)</span>
              </label>

              {/* Selected color pills */}
              <div className="mt-1 flex min-h-0 flex-wrap gap-1.5">
                {selectedFilaments.length === 0 ? (
                  <span className="text-xs italic text-zinc-400">No colors selected yet…</span>
                ) : (
                  selectedFilaments.map((f) => (
                    <span
                      key={f.id}
                      className="inline-flex items-center gap-1.5 rounded-full border border-indigo-200 bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-600"
                    >
                      {f.label}
                      <button
                        type="button"
                        aria-label={`Remove ${f.label}`}
                        onClick={() => removeFilament(f.id)}
                        className="leading-none text-indigo-600/70 hover:text-indigo-700"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))
                )}
              </div>

              {/* Searchable chip-select */}
              {!filamentsLoading && !filamentsError && allFilaments.length > 0 && (
                <Input
                  icon={Search}
                  value={filamentSearch}
                  onChange={(e) => setFilamentSearch(e.target.value)}
                  placeholder="Search colors or finishes…"
                  className="mt-2"
                />
              )}

              <div className="mt-2 max-h-[200px] overflow-y-auto rounded-md border border-zinc-200 bg-white p-2.5">
                {filamentsLoading ? (
                  <div className="flex flex-wrap gap-2">
                    {Array.from({ length: 8 }).map((_, i) => (
                      <Skeleton key={i} className="h-8 w-24 rounded-full" />
                    ))}
                  </div>
                ) : filamentsError ? (
                  <div className="px-1 py-2 text-xs italic text-zinc-400">Could not load filaments</div>
                ) : allFilaments.length === 0 ? (
                  <div className="px-1 py-2 text-xs italic text-zinc-400">No filaments available</div>
                ) : filteredFilaments.length === 0 ? (
                  <div className="px-1 py-2 text-xs italic text-zinc-400">No colors match your search</div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {filteredFilaments.map((f) => {
                      const checked = selectedIds.has(String(f.id));
                      return (
                        <button
                          key={f.id}
                          type="button"
                          onClick={() => toggleFilament(f, !checked)}
                          aria-pressed={checked}
                          className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                            checked
                              ? 'border-indigo-600 bg-indigo-600 text-white'
                              : 'border-zinc-300 bg-white text-zinc-700 hover:border-indigo-300 hover:bg-indigo-50'
                          }`}
                        >
                          {checked && <Check className="h-3 w-3 flex-shrink-0" />}
                          {f.color} — {f.finish}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            <div className="mb-4">
              <label htmlFor="specialInstructions" className="mb-1.5 block text-xs font-semibold text-zinc-500">
                Special Instructions / Comments{' '}
                <span className="text-xs font-normal text-zinc-400">(optional)</span>
              </label>
              <textarea
                id="specialInstructions"
                value={specialInstructions}
                onChange={(e) => setSpecialInstructions(e.target.value)}
                placeholder="e.g., Please use a raft, print at 20% infill, or any other notes..."
                rows={3}
                className="block min-h-[80px] w-full resize-y rounded-md border border-zinc-300 bg-white px-3 py-2.5 text-sm text-zinc-900 transition-colors placeholder:text-zinc-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-full bg-indigo-600 py-3.5 text-sm font-medium text-white transition-colors hover:not-disabled:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 disabled:cursor-not-allowed disabled:bg-zinc-200 disabled:text-zinc-400"
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              {submitting ? 'Submitting...' : 'Submit Request'}
            </button>

            {statusMessage && (
              <div
                className={`mt-4 flex items-center justify-center gap-2 rounded-lg border px-4 py-3 text-center text-sm ${
                  statusMessage.type === 'success'
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                    : 'border-red-200 bg-red-50 text-red-600'
                }`}
              >
                {statusMessage.type === 'success' ? (
                  <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
                ) : (
                  <XCircle className="h-4 w-4 flex-shrink-0" />
                )}
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
        <main className="mx-auto min-h-screen max-w-lg bg-zinc-50 px-6 py-24 text-center text-xs text-zinc-400">
          <p>Loading…</p>
        </main>
      }
    >
      <RequestPageInner />
    </Suspense>
  );
}
