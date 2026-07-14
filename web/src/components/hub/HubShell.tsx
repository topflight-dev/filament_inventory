'use client';

/**
 * components/hub/HubShell.tsx — Brand Bar + Tab Nav Shell
 * ─────────────────────────────────────────────────────────────────────────────
 * Ported from hub.html's .hub-brand-bar / .hub-tab-nav, including the
 * hover-activated "Request Queue" dropdown (Active/Completed filter) added
 * in the "Request Queue Hover Dropdown" log entry. Owns activeTab +
 * queueStatusFilter state and renders the two tab panes (QueueTable /
 * InventoryManager) as children via render props.
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

export default function HubShell({
  shopName,
  children,
}: {
  shopName: string | null;
  children: (activeTab: TabName, queueStatusFilter: QueueStatusFilter) => React.ReactNode;
}) {
  const [activeTab, setActiveTab] = useState<TabName>('queue');
  const [queueStatusFilter, setQueueStatusFilter] = useState<QueueStatusFilter>('active');

  function handleSignOut() {
    sessionStorage.removeItem('c3dw_hub_auth');
    sessionStorage.removeItem('c3dw_shop_slug');
    sessionStorage.removeItem('c3dw_shop_name');
    window.location.reload();
  }

  return (
    <div className="flex min-h-screen flex-col bg-slate-950 text-slate-200">
      {/* BRAND BAR */}
      <div className="flex items-center border-b border-slate-800/80 bg-slate-950 px-6 py-2.5">
        <span className="select-none text-xs font-semibold uppercase tracking-widest text-slate-500">
          ⚙️ C3DW Unified Administration Suite{shopName ? ` — ${shopName}` : ''}
        </span>
        <button
          onClick={handleSignOut}
          className="ml-auto whitespace-nowrap rounded-full border border-slate-800/80 bg-slate-900/70 px-4 py-1.5 text-xs font-medium tracking-wide text-slate-400 transition-colors hover:border-red-500 hover:bg-red-950 hover:text-red-400"
        >
          🚪 Sign Out
        </button>
      </div>

      {/* TAB NAVIGATION */}
      <nav className="flex items-stretch gap-1 border-b-2 border-slate-800/80 bg-slate-950 px-6" aria-label="Admin Hub Tabs">
        <div className="group relative flex">
          <button
            onClick={() => setActiveTab('queue')}
            className={`-mb-0.5 whitespace-nowrap border-b-[3px] px-5 py-3 text-sm font-medium tracking-wide transition-colors ${
              activeTab === 'queue'
                ? 'border-sky-500 text-slate-200'
                : 'border-transparent text-slate-500 hover:bg-white/5 hover:text-slate-400'
            }`}
          >
            🖨️ Request Queue ▾
          </button>
          <div className="invisible absolute top-full left-0 z-[500] min-w-[200px] flex-col gap-0.5 rounded-xl border border-slate-800/80 bg-slate-900/70 p-1.5 opacity-0 shadow-2xl transition-opacity group-hover:visible group-hover:flex group-hover:opacity-100">
            <button
              type="button"
              onClick={() => setQueueStatusFilter('active')}
              className={`block w-full rounded-md px-3.5 py-2.5 text-left text-sm font-medium tracking-wide transition-colors ${
                queueStatusFilter === 'active'
                  ? 'bg-sky-500/10 text-sky-400'
                  : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
              }`}
            >
              📥 Active Queue
            </button>
            <button
              type="button"
              onClick={() => setQueueStatusFilter('completed')}
              className={`block w-full rounded-md px-3.5 py-2.5 text-left text-sm font-medium tracking-wide transition-colors ${
                queueStatusFilter === 'completed'
                  ? 'bg-sky-500/10 text-sky-400'
                  : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
              }`}
            >
              📦 Completed Archive
            </button>
          </div>
        </div>
        <button
          onClick={() => setActiveTab('inventory')}
          className={`-mb-0.5 whitespace-nowrap border-b-[3px] px-5 py-3 text-sm font-medium tracking-wide transition-colors ${
            activeTab === 'inventory'
              ? 'border-sky-500 text-slate-200'
              : 'border-transparent text-slate-500 hover:bg-white/5 hover:text-slate-400'
          }`}
        >
          🎨 Filament Inventory
        </button>
      </nav>

      {/* CONTENT */}
      <div className="hub-scroll flex-1 overflow-y-auto px-6 py-5 pb-10">
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
