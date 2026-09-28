import { NextRequest, NextResponse } from 'next/server';

/**
 * middleware.ts — Marketing / Dashboard Domain Split
 * ─────────────────────────────────────────────────────────────────────────────
 * Added 2026-09-26 as step one of separating the multi-tenant dashboard
 * product (Hub + Request) from the Crafted 3D Workshop marketing site, so
 * neither can break the other and the dashboard isn't tied to Luis's own
 * shop's branding. See the Claude Project docs (notifications-redesign-
 * plan.md, website-architecture-audit.md) for the fuller history this
 * follows on from.
 *
 * UPDATED 2026-09-27 (later same day) — added /api/print-request to
 * DASHBOARD_PREFIXES: the public /request page's print-job submission now
 * goes through this new server route (see api/print-request/route.ts —
 * closes the previously-unrestricted anon INSERT on print_jobs found during
 * the RLS review) instead of a direct client-side Supabase insert, so it
 * needs the same host-split treatment as /api/notify-request already gets.
 *
 * UPDATED 2026-09-27 (later still) — added /signup to DASHBOARD_PREFIXES:
 * the new invite-gated self-serve sign-up page (piece #1 of the test-release
 * plan — see api/hub/signup/route.ts and app/(dashboard)/signup/page.tsx)
 * lives on the dashboard product, not the marketing site, so it needs the
 * same treatment /hub and /request already get. Its own API route,
 * /api/hub/signup, is already covered by the existing /api/hub prefix below.
 *
 * UPDATED 2026-09-28 — printcue.ink's root path ('/') no longer redirects
 * straight to /hub. It now REWRITES to /welcome — Printcue's own public
 * landing page (piece #5 of the test-release plan; see
 * claude/printcue-test-release-plan.md in the Claude Project) — while the
 * address bar keeps showing the bare domain, since a rewrite (unlike a
 * redirect) never changes the visible URL. /welcome is also directly
 * reachable on its own and gets the same host-split treatment as /hub,
 * /request, and /signup via DASHBOARD_PREFIXES below, so it always resolves
 * on printcue.ink regardless of which URL a visitor actually typed or
 * clicked. /api/request-access (the landing page's request-access form)
 * gets the same treatment as the other /api/* dashboard routes.
 *
 * UPDATED 2026-09-27 — product name/domain committed: the dashboard now has
 * its own genuinely separate domain, printcue.ink ("Printcue"), replacing the
 * app.crafted3dworkshop.com subdomain this middleware originally split onto.
 * This was flagged as a one-line change (update APP_HOST) when the subdomain
 * split first shipped, and it was — the only other change needed was adding
 * OLD_APP_HOST below so links already shared under the subdomain (including
 * "Share Your Link" links already sent out before this move) keep working
 * instead of 404ing, exactly the same guarantee the marketing/app split
 * already made for pre-split links.
 *
 * Three hostnames point at this SAME Next.js deployment (one Vercel project,
 * one codebase):
 *   - crafted3dworkshop.com / www.crafted3dworkshop.com  → marketing site
 *     (Luis's own shop's storefront — unaffected by the product rename)
 *   - printcue.ink / www.printcue.ink                    → dashboard product
 *   - app.crafted3dworkshop.com                          → legacy dashboard
 *     subdomain, now permanently redirected to printcue.ink (see below)
 *
 * This middleware enforces that split at the edge, before any page renders:
 *   - Any request to the legacy app.crafted3dworkshop.com host redirects to
 *     the same path (+ query string) on printcue.ink, permanently.
 *   - On the printcue.ink host, only dashboard routes are served; the bare
 *     root path is rewritten (URL unchanged) to the /welcome landing page,
 *     and anything else (a marketing page) redirects to the same path on
 *     the marketing host.
 *   - On the marketing host, dashboard routes (/hub, /request, their APIs)
 *     redirect to the same path on printcue.ink — so any link already shared
 *     under any prior domain keeps working instead of 404ing.
 *   - Any other host (localhost, a Vercel preview URL, etc.) passes straight
 *     through untouched — local dev and preview deployments keep serving
 *     everything, unsplit, exactly as before.
 *
 * ShareLinkModal already builds its link from window.location.origin, so it
 * needs no change here — it will simply start handing out printcue.ink links
 * the moment a shop owner opens it from the new domain. The notification
 * "View Dashboard" links read HUB_DASHBOARD_URL, not a hardcoded string — see
 * api/notify-request/route.ts; that env var needs updating to
 * https://printcue.ink in Vercel alongside this deploy.
 * ─────────────────────────────────────────────────────────────────────────────
 */

const MARKETING_HOSTS = new Set(['crafted3dworkshop.com', 'www.crafted3dworkshop.com']);
const CANONICAL_MARKETING_HOST = 'www.crafted3dworkshop.com';

const APP_HOSTS = new Set(['printcue.ink', 'www.printcue.ink']);
const APP_HOST = 'printcue.ink';

// Legacy dashboard subdomain from the 2026-09-26 split — retired in favor of
// printcue.ink, but permanently redirected (not removed) so nothing already
// shared under it breaks.
const OLD_APP_HOST = 'app.crafted3dworkshop.com';

// Path prefixes that belong to the dashboard product, not the marketing site.
const DASHBOARD_PREFIXES = [
  '/hub',
  '/request',
  '/signup',
  '/welcome',
  '/api/hub',
  '/api/notify-request',
  '/api/print-request',
  '/api/request-access',
];

// Never redirected based on host — hit directly by Vercel Cron, not a browser.
const ALWAYS_ALLOW_PREFIXES = ['/api/keepalive'];

function pathStartsWithAny(pathname: string, prefixes: string[]): boolean {
  return prefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

export function middleware(request: NextRequest) {
  const host = request.headers.get('host')?.split(':')[0] ?? '';
  const { pathname } = request.nextUrl;

  if (pathStartsWithAny(pathname, ALWAYS_ALLOW_PREFIXES)) {
    return NextResponse.next();
  }

  // Legacy subdomain — send everything to the real domain, path + query intact.
  if (host === OLD_APP_HOST) {
    const url = request.nextUrl.clone();
    url.host = APP_HOST;
    return NextResponse.redirect(url, 308);
  }

  const onAppHost = APP_HOSTS.has(host);
  const onMarketingHost = MARKETING_HOSTS.has(host);

  // Unknown host (localhost, a *.vercel.app preview, etc.) — no split, pass through.
  if (!onAppHost && !onMarketingHost) {
    return NextResponse.next();
  }

  const isDashboardPath = pathStartsWithAny(pathname, DASHBOARD_PREFIXES);

  if (onAppHost) {
    if (pathname === '/') {
      const url = request.nextUrl.clone();
      url.pathname = '/welcome';
      return NextResponse.rewrite(url);
    }
    if (!isDashboardPath) {
      const url = request.nextUrl.clone();
      url.host = CANONICAL_MARKETING_HOST;
      return NextResponse.redirect(url, 308);
    }
  }

  if (onMarketingHost && isDashboardPath) {
    const url = request.nextUrl.clone();
    url.host = APP_HOST;
    return NextResponse.redirect(url, 308);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
