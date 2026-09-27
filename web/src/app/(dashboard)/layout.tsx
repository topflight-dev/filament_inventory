/**
 * (dashboard)/layout.tsx — Dashboard route group metadata
 * ─────────────────────────────────────────────────────────────────────────────
 * Added 2026-09-26, branding-decoupling pass. `hub/page.tsx` is a client
 * component ('use client'), so it can't export its own `metadata` — without
 * this layout, the browser tab for /hub silently inherited the root layout's
 * title, "Crafted 3D Workshop", even though this dashboard is meant to read
 * as its own product, decoupled from Luis's own shop's brand (see
 * HubShell.tsx's header comment and claude/dashboard-domain-split-plan.md
 * "Design pass" sections for the full reasoning). This is a plain server
 * layout with no markup of its own — it only exists to carry the metadata
 * override for everything under this route group.
 * ─────────────────────────────────────────────────────────────────────────────
 */
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Shop Admin Dashboard',
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return children;
}
