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
 * Two hostnames point at this SAME Next.js deployment (one Vercel project,
 * one codebase — see the domain-split plan doc for why a second deployment
 * wasn't needed for this):
 *   - crafted3dworkshop.com / www.crafted3dworkshop.com  → marketing site
 *   - app.crafted3dworkshop.com                          → dashboard product
 *
 * This middleware enforces that split at the edge, before any page renders:
 *   - On the app/dashboard host, only dashboard routes are served; the bare
 *     root path goes straight to /hub, and anything else (a marketing page)
 *     redirects to the same path on the marketing host.
 *   - On the marketing host, dashboard routes (/hub, /request, their APIs)
 *     redirect to the same path on the app host — so any link already shared
 *     before this split (including the "Share Your Link" links already sent
 *     out) keeps working instead of 404ing.
 *   - Any other host (localhost, a Vercel preview URL, etc.) passes straight
 *     through untouched — local dev and preview deployments keep serving
 *     everything, unsplit, exactly as before.
 *
 * Moving to a genuinely separate product domain later (not just this
 * subdomain) is a one-line change here (update APP_HOST) plus the matching
 * DNS/Vercel domain setup — nothing else in the app hardcodes this domain.
 * ShareLinkModal already builds its link from window.location.origin, and
 * the two notification "View Dashboard" links now read HUB_DASHBOARD_URL
 * instead of a hardcoded string — see api/notify-request/route.ts.
 * ─────────────────────────────────────────────────────────────────────────────
 */

const MARKETING_HOSTS = new Set(['crafted3dworkshop.com', 'www.crafted3dworkshop.com']);
const CANONICAL_MARKETING_HOST = 'www.crafted3dworkshop.com';
const APP_HOST = 'app.crafted3dworkshop.com';

// Path prefixes that belong to the dashboard product, not the marketing site.
const DASHBOARD_PREFIXES = ['/hub', '/request', '/api/hub', '/api/notify-request'];

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

  const onAppHost = host === APP_HOST;
  const onMarketingHost = MARKETING_HOSTS.has(host);

  // Unknown host (localhost, a *.vercel.app preview, etc.) — no split, pass through.
  if (!onAppHost && !onMarketingHost) {
    return NextResponse.next();
  }

  const isDashboardPath = pathStartsWithAny(pathname, DASHBOARD_PREFIXES);

  if (onAppHost) {
    if (pathname === '/') {
      const url = request.nextUrl.clone();
      url.pathname = '/hub';
      return NextResponse.redirect(url, 307);
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
