'use client';

/**
 * components/hub/HubShell.tsx — Brand Bar + Tab Nav Shell
 * ─────────────────────────────────────────────────────────────────────────────
 * Ported from hub.html's .hub-brand-bar / .hub-tab-nav, including the
 * hover-activated "Request Queue" dropdown (Active/Completed filter) added
 * in the "Request Queue Hover Dropdown" log entry. Owns activeTab +
 * queueStatusFilter state and renders the two tab panes (QueueTable /
 * InventoryManager) as children via render props.
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
    <div className="flex min-h-screen flex-col bg-[#1a1a1a] text-white">
      {/* BRAND BAR */}
      <div className="flex items-center border-b border-zinc-800 bg-[#111111] px-6 py-2.5">
        <span className="select-none text-sm font-bold uppercase tracking-wider text-zinc-400">
          ⚙️ C3DW Unified Administration Suite{shopName ? ` — ${shopName}` : ''}
        </span>
        <button
          onClick={handleSignOut}
          className="ml-auto whitespace-nowrap rounded-full border border-zinc-700 bg-zinc-900 px-4 py-1.5 text-xs font-bold tracking-wide text-zinc-400 transition-colors hover:border-red-500 hover:bg-red-950 hover:text-red-400"
        >
          🚪 Sign Out
        </button>
      </div>

      {/* TAB NAVIGATION */}
      <nav className="flex items-stretch gap-1 border-b-2 border-zinc-800 bg-[#161616] px-6" aria-label="Admin Hub Tabs">
        <div className="group relative flex">
          <button
            onClick={() => setActiveTab('queue')}
            className={`-mb-0.5 whitespace-nowrap border-b-[3px] px-5 py-3 text-sm font-bold tracking-wide transition-colors ${
              activeTab === 'queue'
                ? 'border-blue-500 text-white'
                : 'border-transparent text-zinc-500 hover:bg-white/5 hover:text-zinc-300'
            }`}
          >
            🖨️ Request Queue ▾
          </button>
          <div className="invisible absolute top-full left-0 z-[500] min-w-[200px] flex-col gap-0.5 rounded-lg border border-zinc-700 bg-zinc-900 p-1.5 opacity-0 shadow-2xl transition-opacity group-hover:visible group-hover:flex group-hover:opacity-100">
            <button
              type="button"
              onClick={() => setQueueStatusFilter('active')}
              className={`block w-full rounded-md px-3.5 py-2.5 text-left text-sm font-semibold tracking-wide transition-colors ${
                queueStatusFilter === 'active'
                  ? 'bg-blue-500/10 text-blue-400'
                  : 'text-zinc-400 hover:bg-white/5 hover:text-white'
              }`}
            >
              📥 Active Queue
            </button>
            <button
              type="button"
              onClick={() => setQueueStatusFilter('completed')}
              className={`block w-full rounded-md px-3.5 py-2.5 text-left text-sm font-semibold tracking-wide transition-colors ${
                queueStatusFilter === 'completed'
                  ? 'bg-blue-500/10 text-blue-400'
                  : 'text-zinc-400 hover:bg-white/5 hover:text-white'
              }`}
            >
              📦 Completed Archive
            </button>
          </div>
        </div>
        <button
          onClick={() => setActiveTab('inventory')}
          className={`-mb-0.5 whitespace-nowrap border-b-[3px] px-5 py-3 text-sm font-bold tracking-wide transition-colors ${
            activeTab === 'inventory'
              ? 'border-blue-500 text-white'
              : 'border-transparent text-zinc-500 hover:bg-white/5 hover:text-zinc-300'
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
        .hub-scroll:hover { scrollbar-color: rgba(156,163,175,0.25) transparent; }
        .hub-scroll::-webkit-scrollbar { width: 4px; }
        .hub-scroll::-webkit-scrollbar-track { background: transparent; }
        .hub-scroll::-webkit-scrollbar-thumb { background: transparent; border-radius: 4px; }
        .hub-scroll:hover::-webkit-scrollbar-thumb { background: rgba(156,163,175,0.25); }
      `}</style>
    </div>
  );
}
