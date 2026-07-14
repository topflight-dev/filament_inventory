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
 * Visual palette: "Deep Navy & Slate Gray" theme — deep navy canvas
 * (#0F172A), slate gray panels (#1E293B, border-slate-700/60, rounded-xl),
 * indigo (#4F46E5) primary actions, crisp white (#F1F5F9) headings, muted
 * slate (#94A3B8) body/labels, dim slate (#64748B) accents.
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
    <div className="flex min-h-screen flex-col bg-[#0F172A] text-[#F1F5F9]">
      {/* BRAND BAR */}
      <div className="flex items-center border-b border-slate-700/60 bg-[#0F172A] px-6 py-2.5">
        <span className="select-none text-sm font-bold uppercase tracking-wider text-[#94A3B8]">
          ⚙️ C3DW Unified Administration Suite{shopName ? ` — ${shopName}` : ''}
        </span>
        <button
          onClick={handleSignOut}
          className="ml-auto whitespace-nowrap rounded-full border border-slate-700/60 bg-[#1E293B] px-4 py-1.5 text-xs font-bold tracking-wide text-[#94A3B8] transition-colors hover:border-red-500 hover:bg-red-950 hover:text-red-400"
        >
          🚪 Sign Out
        </button>
      </div>

      {/* TAB NAVIGATION */}
      <nav className="flex items-stretch gap-1 border-b-2 border-slate-700/60 bg-[#0F172A] px-6" aria-label="Admin Hub Tabs">
        <div className="group relative flex">
          <button
            onClick={() => setActiveTab('queue')}
            className={`-mb-0.5 whitespace-nowrap border-b-[3px] px-5 py-3 text-sm font-bold tracking-wide transition-colors ${
              activeTab === 'queue'
                ? 'border-[#4F46E5] text-[#F1F5F9]'
                : 'border-transparent text-[#64748B] hover:bg-white/5 hover:text-[#94A3B8]'
            }`}
          >
            🖨️ Request Queue ▾
          </button>
          <div className="invisible absolute top-full left-0 z-[500] min-w-[200px] flex-col gap-0.5 rounded-xl border border-slate-700/60 bg-[#1E293B] p-1.5 opacity-0 shadow-2xl transition-opacity group-hover:visible group-hover:flex group-hover:opacity-100">
            <button
              type="button"
              onClick={() => setQueueStatusFilter('active')}
              className={`block w-full rounded-md px-3.5 py-2.5 text-left text-sm font-semibold tracking-wide transition-colors ${
                queueStatusFilter === 'active'
                  ? 'bg-[#4F46E5]/10 text-[#818CF8]'
                  : 'text-[#94A3B8] hover:bg-white/5 hover:text-[#F1F5F9]'
              }`}
            >
              📥 Active Queue
            </button>
            <button
              type="button"
              onClick={() => setQueueStatusFilter('completed')}
              className={`block w-full rounded-md px-3.5 py-2.5 text-left text-sm font-semibold tracking-wide transition-colors ${
                queueStatusFilter === 'completed'
                  ? 'bg-[#4F46E5]/10 text-[#818CF8]'
                  : 'text-[#94A3B8] hover:bg-white/5 hover:text-[#F1F5F9]'
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
              ? 'border-[#4F46E5] text-[#F1F5F9]'
              : 'border-transparent text-[#64748B] hover:bg-white/5 hover:text-[#94A3B8]'
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
