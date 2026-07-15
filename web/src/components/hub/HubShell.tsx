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
 * Visual palette: "Deep Oceanic Stealth" theme — arctic twilight blue canvas
 * (bg-slate-950), frosted navy slate panels (bg-slate-900/70,
 * border-slate-800/80, rounded-xl), vibrant cyan (sky-500) primary/active
 * accents with dark text for max contrast, slate-200/slate-400/slate-500
 * text hierarchy.
 * ─────────────────────────────────────────────────────────────────────────────
 */
import { useState } from 'react';
import type { QueueStatusFilter } from '@/lib/supabase/hub-queries';

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

  function handleSignOut() {
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

  const navItems: { key: NavKey; icon: string; label: string }[] = [
    { key: 'queue', icon: '🖨️', label: 'Request Queue' },
    { key: 'completed', icon: '📦', label: 'Completed' },
    { key: 'inventory', icon: '🎨', label: 'Filament Inventory' },
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
            ☰
          </button>
          <div
            className={`overflow-hidden whitespace-nowrap transition-all duration-300 ${
              collapsed ? 'max-w-0 opacity-0' : 'max-w-[180px] opacity-100'
            }`}
          >
            <span className="block text-[11px] font-semibold uppercase tracking-widest text-slate-500">
              ⚙️ C3DW Admin
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
                <span className="flex-shrink-0 text-base leading-none">{item.icon}</span>
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

        {/* SIGN OUT — pinned to bottom footer */}
        <div className="border-t border-slate-800/80 px-2 py-3">
          <button
            onClick={handleSignOut}
            title={collapsed ? 'Sign Out' : undefined}
            className="flex w-full items-center gap-3 rounded-xl border border-slate-800/80 bg-slate-900/70 px-3 py-2.5 text-xs font-medium tracking-wide text-slate-400 transition-colors hover:border-red-500 hover:bg-red-950 hover:text-red-400"
          >
            <span className="flex-shrink-0 text-base leading-none">🚪</span>
            <span
              className={`overflow-hidden whitespace-nowrap transition-all duration-300 ${
                collapsed ? 'max-w-0 opacity-0' : 'max-w-[140px] opacity-100'
              }`}
            >
              Sign Out
            </span>
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT — fluid, adapts to sidebar width */}
      <div className="hub-scroll flex-1 overflow-y-auto px-6 py-5 pb-10 transition-all duration-300">
        {children(activeTab, queueStatusFilter)}
      </div>

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
