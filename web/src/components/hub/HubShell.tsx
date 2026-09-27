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
 * UPDATED 2026-09-26 (design pass — see claude/dashboard-domain-split-plan.md
 * "Follow-up work" for the fuller context on why this dashboard's visual
 * polish matters now that it's a standalone product): every emoji used as a
 * functional icon (☰🖨️📦🎨🔗🔔🔑🚪⚙️) is replaced with a real icon from
 * lucide-react — consistent stroke width/sizing that actually matches the
 * theme, instead of OS-dependent emoji glyphs. Purely visual; no behavior
 * changed.
 *
 * Visual palette: "Deep Oceanic Stealth" theme — arctic twilight blue canvas
 * (bg-slate-950), frosted navy slate panels (bg-slate-900/70,
 * border-slate-800/80, rounded-xl), vibrant cyan (sky-500) primary/active
 * accents with dark text for max contrast, slate-200/slate-400/slate-500
 * text hierarchy.
 * ─────────────────────────────────────────────────────────────────────────────
 */
import { useState } from 'react';
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
    <div className="flex min-h-screen bg-slate-950 text-slate-200">
      {/* VERTICAL SIDEBAR */}
      <aside
        className={`flex flex-shrink-0 flex-col border-r border-slate-800/80 bg-slate-950 transition-all duration-300 ${
          collapsed ? 'w-16' : 'w-64'
        }`}
      >
        {/* SIDEBAR HEADER — shop name pinned to top */}
        <div className="flex items-center gap-2 border-b border-slate-800/80 px-3 py-3">
          <button
            type="button"
            onClick={() => setCollapsed((v) => !v)}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg border border-slate-800/80 bg-slate-900/70 text-slate-400 transition-colors hover:border-sky-500 hover:text-sky-400"
          >
            {collapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
          </button>
          <div
            className={`overflow-hidden whitespace-nowrap transition-all duration-300 ${
              collapsed ? 'max-w-0 opacity-0' : 'max-w-[180px] opacity-100'
            }`}
          >
            <span className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-widest text-slate-500">
              <Settings className="h-3 w-3" />
              C3DW Admin
            </span>
            {shopName && (
              <span className="block truncate text-xs font-medium text-slate-300">{shopName}</span>
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
                    ? 'bg-sky-500/10 text-sky-400'
                    : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
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
        <div className="border-t border-slate-800/80 px-2 py-3">
          {footerItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.key}
                onClick={item.onClick}
                title={collapsed ? item.label : undefined}
                className={`mb-2 flex w-full items-center gap-3 rounded-xl border border-slate-800/80 bg-slate-900/70 px-3 py-2.5 text-xs font-medium tracking-wide text-slate-400 transition-colors last:mb-0 ${
                  item.danger
                    ? 'hover:border-red-500 hover:bg-red-950 hover:text-red-400'
                    : 'hover:border-sky-500 hover:text-sky-400'
                }`}
              >
                <Icon className="h-4 w-4 flex-shrink-0" strokeWidth={2} />
                <span
                  className={`overflow-hidden whitespace-nowrap transition-all duration-300 ${
                    collapsed ? 'max-w-0 opacity-0' : 'max-w-[140px] opacity-100'
                  }`}
                >
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </aside>

      {/* MAIN CONTENT — fluid, adapts to sidebar width */}
      <div className="hub-scroll flex-1 overflow-y-auto px-6 py-5 pb-10 transition-all duration-300">
        {children(activeTab, queueStatusFilter)}
      </div>

      <ChangePasscodeModal open={showChangePasscode} onClose={() => setShowChangePasscode(false)} />
      <NotificationSettingsModal
        open={showNotificationSettings}
        onClose={() => setShowNotificationSettings(false)}
      />
      <ShareLinkModal open={showShareLink} onClose={() => setShowShareLink(false)} />

      <style>{`
        .hub-scroll { scrollbar-width: thin; scrollbar-color: transparent transparent; }
        .hub-scroll:hover { scrollbar-color: rgba(148,163,184,0.25) transparent; }
        .hub-scroll::-webkit-scrollbar { width: 4px; }
        .hub-scroll::-webkit-scrollbar-track { background: transparent; }
        .hub-scroll::-webkit-scrollbar-thumb { background: transparent; border-radius: 4px; }
        .hub-scroll:hover::-webkit-scrollbar-thumb { background: rgba(148,163,184,0.25); }
      `}</style>
    </div>
  );
}
