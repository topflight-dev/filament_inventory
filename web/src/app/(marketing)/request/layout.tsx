/**
 * (marketing)/request/layout.tsx — Request page metadata
 * ─────────────────────────────────────────────────────────────────────────────
 * Added 2026-09-26, branding-decoupling pass. `request/page.tsx` is a client
 * component ('use client'), so it can't export its own `metadata`, and only
 * overwrites `document.title` client-side once a shop's branding has loaded
 * (see the "SHOP BRANDING INJECTION" effect in page.tsx). Until that fires —
 * and for the "Shop Not Found" gate state, which never fires it — the tab
 * silently fell back to the root layout's title, "Crafted 3D Workshop",
 * which is wrong for any shop but Luis's own. This gives the route a neutral
 * default that the client-side per-shop title still overrides once it loads.
 *
 * UPDATED 2026-09-27 — default now names Printcue (the dashboard product)
 * rather than being fully generic, since a shop's own name still takes over
 * the instant it loads; this is only what a visitor sees for the brief
 * window (or "Shop Not Found" case) before that happens.
 * ─────────────────────────────────────────────────────────────────────────────
 */
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Submit a Print Request | Printcue',
};

export default function RequestLayout({ children }: { children: React.ReactNode }) {
  return children;
}
