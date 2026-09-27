'use client';

/**
 * components/hub/HubShell.tsx — Collapsible Vertical Sidebar Shell
 * ─────────────────────────────────────────────────────────────────────────────
 * Rewritten from the legacy top horizontal tab bar + hover dropdown (see
 * "Request Queue Hover Dropdown" log entry, now retired) to a state-driven
 * collapsible vertical sidebar (Gemini-style) — see "Collapsible Sidebar
 * Navigation Deployment" log entry. Owns activeTab + queueStatusFilter state
 * and renders the two tab panes (QueueTable / InventoryManager) as children
 * via render props — the render-prop signature is unchanged so the parent
 * hub/page.tsx requires zero modification.
 *
 * The former "Active Queue" / "Completed Archive" hover-dropdown options are
 * now first-class sidebar nav items ("Request Queue" and "Completed"), both
 * mapped onto the same underlying activeTab === 'queue' pane, distinguished
 * only by queueStatusFilter — QueueTable's data fetching/subscription logic
 * is untouched.
 *
 * Sidebar footer (top-down: Share Your Link, Notifications, Change Passcode,
 * Sign Out) opens one of three modals — ShareLinkModal and
 * NotificationSettingsModal both added 2026-09-26 as part of the multi-tenant
 * notifications redesign (see claude/notifications-redesign-plan.md in the
 * Claude Project). Same pattern for all three: a state flag flips on click,
 * the modal is rendered unconditionally at the bottom of this component and
 * no-ops (returns null) while closed.
 *
 * Share Your Link is listed first because handing a shop owner their own
 * exact, correct `/request?shop=<slug>` link is the multi-tenant fix that
 * makes the whole feature trustworthy — see ShareLinkModal.tsx's own header
 * comment for the full incident this closes out.
 *
 * UPDATED 2026-09-26 (icon pass): every emoji used as a functional icon
 * (☰🖨️📦🎨🔗🔔🔑🚪⚙️) replaced with a real lucide-react icon.
 *
 * UPDATED 2026-09-26 (visual redesign, phase 2 — see
 * claude/dashboard-domain-split-plan.md "Design pass" section for the full
 * reasoning): retired the "Deep Oceanic Stealth" dark theme in favor of a
 * neutral, light SaaS theme — zinc neutrals (bg-zinc-50 canvas, white
 * panels, zinc-200 borders, zinc-900/500/400 text hierarchy) with a single
 * indigo accent (indigo-600), deliberately decoupled from both the warm
 * "Creative Studio" marketing-site palette and the old dark cyan theme.
 * Reasoning: Luis wants this dashboard to eventually be a standalone
 * product other shop owners use under their own branding, so it shouldn't
 * carry Crafted 3D Workshop's own colors — but it also needed to stop
 * feeling "rough," which came from juggling too many competing hues at
 * once (slate+sky+amber+emerald+red). This theme is shared verbatim across
 * every Hub/Request file in this pass.
 *
 * UPDATED 2026-09-26 (phase 3): sidebar footer buttons migrated onto the
 * shared Button component (ghost / ghost-danger variants — the latter added
 * for Sign Out, which needs to stay neutral by default and only turn red on
 * hover, unlike the always-red `destructive` variant). Also added a fade+
 * slide transition (framer-motion) on the main content area, keyed on the
 * active nav item, so switching Queue/Completed/Inventory feels like a real
 * view transition instead of an instant content swap.
 * ─────────────────────────────────────────────────────────────────────────────
 */
import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Bell,
  KeyRound,
  Link2,
  LogOut,
  Package,
  PanelLeftClose,
  PanelLeftOpen,
  Palette,
  Printer,
  Settings,
  type LucideIcon,
} from 'lucide-react';
import type { QueueStatusFilter } from '@/lib/supabase/hub-queries';
import ChangePasscodeModal from './ChangePasscodeModal';
import NotificationSettingsModal from './NotificationSettingsModal';
import ShareLinkModal from './ShareLinkModal';
import Button from '@/components/ui/Button';

type TabName = 'queue' | 'inventory';

type NavKey = 'queue' | 'completed' | 'inventory';

export default function HubShell({
  shopName,
  children,
}: {
  shopName: string | null;
  children: (activeTab: TabName, queueStatusFilter: QueueStatusFilter) => React.ReactNode;
}) {
  const [activeTab, setActiveTab] = useState<TabName>('queue');
  const [queueStatusFilter, setQueueStatusFilter] = useState<QueueStatusFilter>('active');
  const [collapsed, setCollapsed] = useState(false);
  const [showChangePasscode, setShowChangePasscode] = useState(false);
  const [showNotificationSettings, setShowNotificationSettings] = useState(false);
  const [showShareLink, setShowShareLink] = useState(false);

  async function handleSignOut() {
    try {
      await fetch('/api/hub/logout', { method: 'POST' });
    } catch (err) {
      console.warn('[C3DW Auth] Sign-out request failed:', err);
    }
    sessionStorage.removeItem('c3dw_hub_auth');
    sessionStorage.removeItem('c3dw_shop_slug');
    sessionStorage.removeItem('c3dw_shop_name');
    window.location.reload();
  }

  const activeNav: NavKey =
    activeTab === 'inventory' ? 'inventory' : queueStatusFilter === 'completed' ? 'completed' : 'queue';

  function selectNav(nav: NavKey) {
    if (nav === 'inventory') {
      setActiveTab('inventory');
      return;
    }
    setActiveTab('queue');
    setQueueStatusFilter(nav === 'completed' ? 'completed' : 'active');
  }

  const navItems: { key: NavKey; icon: LucideIcon; label: string }[] = [
    { key: 'queue', icon: Printer, label: 'Request Queue' },
    { key: 'completed', icon: Package, label: 'Completed' },
    { key: 'inventory', icon: Palette, label: 'Filament Inventory' },
  ];

  const footerItems: { key: string; icon: LucideIcon; label: string; onClick: () => void; danger?: boolean }[] = [
    { key: 'share', icon: Link2, label: 'Share Your Link', onClick: () => setShowShareLink(true) },
    { key: 'notifications', icon: Bell, label: 'Notifications', onClick: () => setShowNotificationSettings(true) },
    { key: 'passcode', icon: KeyRound, label: 'Change Passcode', onClick: () => setShowChangePasscode(true) },
    { key: 'signout', icon: LogOut, label: 'Sign Out', onClick: handleSignOut, danger: true },
  ];

  return (
    <div className="flex min-h-screen bg-zinc-50 text-zinc-900">
      {/* VERTICAL SIDEBAR */}
      <aside
        className={`flex flex-shrink-0 flex-col border-r border-zinc-200 bg-white transition-all duration-300 ${
          collapsed ? 'w-16' : 'w-64'
        }`}
      >
        {/* SIDEBAR HEADER — shop name pinned to top */}
        <div className="flex items-center gap-2 border-b border-zinc-200 px-3 py-3">
          <button
            type="button"
            onClick={() => setCollapsed((v) => !v)}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg border border-zinc-200 bg-white text-zinc-500 transition-colors hover:border-indigo-300 hover:text-indigo-600"
          >
            {collapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
          </button>
          <div
            className={`overflow-hidden whitespace-nowrap transition-all duration-300 ${
              collapsed ? 'max-w-0 opacity-0' : 'max-w-[180px] opacity-100'
            }`}
          >
            <span className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-widest text-zinc-400">
              <Settings className="h-3 w-3" />
              C3DW Admin
            </span>
            {shopName && (
              <span className="block truncate text-xs font-medium text-zinc-700">{shopName}</span>
            )}
          </div>
        </div>

        {/* NAV ITEMS */}
        <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-2 py-3" aria-label="Admin Hub Navigation">
          {navItems.map((item) => {
            const isActive = activeNav === item.key;
            const Icon = item.icon;
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => selectNav(item.key)}
                title={collapsed ? item.label : undefined}
                className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium tracking-wide transition-colors ${
                  isActive
                    ? 'bg-indigo-50 text-indigo-600'
                    : 'text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900'
                }`}
              >
                <Icon className="h-[18px] w-[18px] flex-shrink-0" strokeWidth={2} />
                <span
                  className={`overflow-hidden whitespace-nowrap transition-all duration-300 ${
                    collapsed ? 'max-w-0 opacity-0' : 'max-w-[160px] opacity-100'
                  }`}
                >
                  {item.label}
                </span>
              </button>
            );
          })}
        </nav>

        {/* FOOTER — Share Link, Notifications, Change Passcode, Sign Out — pinned to bottom */}
        <div className="border-t border-zinc-200 px-2 py-3">
          {footerItems.map((item) => (
            <Button
              key={item.key}
              type="button"
              onClick={item.onClick}
              title={collapsed ? item.label : undefined}
              variant={item.danger ? 'ghost-danger' : 'ghost'}
              icon={item.icon}
              fullWidth
              className="mb-2 !justify-start !gap-3 !rounded-xl !px-3 !text-xs tracking-wide last:mb-0"
            >
              <span
                className={`overflow-hidden whitespace-nowrap transition-all duration-300 ${
                  collapsed ? 'max-w-0 opacity-0' : 'max-w-[140px] opacity-100'
                }`}
              >
                {item.label}
              </span>
            </Button>
          ))}
        </div>
      </aside>

      {/* MAIN CONTENT — fluid, adapts to sidebar width */}
      <div className="hub-scroll flex-1 overflow-y-auto px-6 py-5 pb-10 transition-all duration-300">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeNav}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
          >
            {children(activeTab, queueStatusFilter)}
          </motion.div>
        </AnimatePresence>
      </div>

      <ChangePasscodeModal open={showChangePasscode} onClose={() => setShowChangePasscode(false)} />
      <NotificationSettingsModal
        open={showNotificationSettings}
        onClose={() => setShowNotificationSettings(false)}
      />
      <ShareLinkModal open={showShareLink} onClose={() => setShowShareLink(false)} />

      <style>{`
        .hub-scroll { scrollbar-width: thin; scrollbar-color: transparent transparent; }
        .hub-scroll:hover { scrollbar-color: rgba(161,161,170,0.4) transparent; }
        .hub-scroll::-webkit-scrollbar { width: 4px; }
        .hub-scroll::-webkit-scrollbar-track { background: transparent; }
        .hub-scroll::-webkit-scrollbar-thumb { background: transparent; border-radius: 4px; }
        .hub-scroll:hover::-webkit-scrollbar-thumb { background: rgba(161,161,170,0.4); }
      `}</style>
    </div>
  );
}
