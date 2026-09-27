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
 * ─────────────────────────────────────────────────────────────────────────────
 */
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Submit a Print Request',
};

export default function RequestLayout({ children }: { children: React.ReactNode }) {
  return children;
}
