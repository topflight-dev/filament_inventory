'use client';

/**
 * components/hub/InventoryManager.tsx — Filament Inventory Tab
 * ─────────────────────────────────────────────────────────────────────────────
 * Ported from hub.html's #inventory-tab-pane: add-filament form, finish
 * dropdown (+ "Add New Finish" prompt), collapsible finish-grouped list,
 * in-stock toggle (with optimistic pending-state), delete, and search filter.
 * Edits to color/finish are delegated to InvEditModal.
 *
 * UPDATED 2026-09-26 (design pass): emoji icons (⏳➕🔍🎨✅❌🗑️▸▾) replaced with
 * lucide-react icons — real spinners on in-flight actions, chevrons for the
 * collapsible groups.
 *
 * Visual palette: "Deep Oceanic Stealth" theme — arctic twilight blue canvas
 * (bg-slate-950), frosted navy slate panels (bg-slate-900/70,
 * border-slate-800/80, rounded-xl), vibrant cyan (sky-500) primary actions
 * with dark text for max contrast, emerald for "In Stock" (functional
 * active-state indicator, unchanged), crisp slate-200 primary text,
 * slate-400/slate-500 secondary text hierarchy.
 * ─────────────────────────────────────────────────────────────────────────────
 */
import { useCallback, useEffect, useState } from 'react';
import {
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Loader2,
  Palette,
  Plus,
  Search,
  Trash2,
  XCircle,
} from 'lucide-react';
import { type ColorItem } from '@/lib/supabase/hub-queries';
import InvEditModal, { type InvEditTarget } from './InvEditModal';

const ADD_NEW_FINISH = '__add_new__';

export default function InventoryManager({ showToast }: { showToast: (msg: string) => void }) {
  const [colors, setColors] = useState<ColorItem[]>([]);
  const [finishes, setFinishes] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const [pendingStockIds, setPendingStockIds] = useState<Set<string | number>>(new Set());
  const [editTarget, setEditTarget] = useState<InvEditTarget | null>(null);

  // ADD FORM STATE
  const [newColor, setNewColor] = useState('');
  const [newFinish, setNewFinish] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newHex1, setNewHex1] = useState('#ffffff');
  const [newHex2, setNewHex2] = useState('#ffffff');
  const [newHex3, setNewHex3] = useState('#ffffff');
  const [submitting, setSubmitting] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [colorsRes, finishesRes] = await Promise.all([
        fetch('/api/hub/colors'),
        fetch('/api/hub/finishes'),
      ]);
      if (!colorsRes.ok) throw new Error(`Request failed with status ${colorsRes.status}`);
      if (!finishesRes.ok) throw new Error(`Request failed with status ${finishesRes.status}`);
      const colorData = (await colorsRes.json()) as ColorItem[];
      const finishData = (await finishesRes.json()) as string[];
      setColors(colorData);
      setFinishes(finishData);
      if (!newFinish && finishData.length > 0) setNewFinish(finishData[0]);
    } catch (err) {
      console.error('Inventory fetch failed:', err);
      showToast('❌ Could not load inventory');
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  function handleFinishSelect(value: string) {
    if (value === ADD_NEW_FINISH) {
      const custom = window.prompt('Enter new finish name:');
      if (custom && custom.trim() !== '') {
        const trimmed = custom.trim();
        setFinishes((prev) => [...new Set([...prev, trimmed])].sort());
        setNewFinish(trimmed);
      }
      return;
    }
    setNewFinish(value);
  }

  async function handleAddFilament(e: React.FormEvent) {
    e.preventDefault();
    if (!newColor.trim() || !newFinish.trim()) {
      showToast('❌ Color and finish are required');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/hub/colors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          color: newColor.trim(),
          finish: newFinish.trim(),
          description: newDescription.trim(),
          colorHex1: newHex1,
          colorHex2: newHex2,
          colorHex3: newHex3,
          inStock: true,
        }),
      });
      if (!res.ok) throw new Error(`Request failed with status ${res.status}`);
      showToast('✅ Filament added successfully');
      setNewColor('');
      setNewDescription('');
      setNewHex1('#ffffff');
      setNewHex2('#ffffff');
      setNewHex3('#ffffff');
      await refresh();
    } catch (err) {
      console.error('Add filament failed:', err);
      const message = err instanceof Error ? err.message : 'Unknown error';
      showToast(`❌ Add failed: ${message}`);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleToggleStock(item: ColorItem) {
    setPendingStockIds((prev) => new Set(prev).add(item.id));
    const nextValue = !item.inStock;
    setColors((prev) => prev.map((c) => (c.id === item.id ? { ...c, inStock: nextValue } : c)));

    try {
      const res = await fetch(`/api/hub/colors/${item.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inStock: nextValue }),
      });
      if (!res.ok) throw new Error(`Request failed with status ${res.status}`);
    } catch (err) {
      console.error('Stock toggle failed:', err);
      setColors((prev) => prev.map((c) => (c.id === item.id ? { ...c, inStock: item.inStock } : c)));
      showToast('❌ Update failed — reverted');
    } finally {
      setPendingStockIds((prev) => {
        const next = new Set(prev);
        next.delete(item.id);
        return next;
      });
    }
  }

  async function handleDelete(item: ColorItem) {
    const confirmed = window.confirm(`Delete "${item.color}" (${item.finish})? This cannot be undone.`);
    if (!confirmed) return;

    try {
      const res = await fetch(`/api/hub/colors/${item.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error(`Request failed with status ${res.status}`);
      showToast('🗑️ Filament deleted');
      await refresh();
    } catch (err) {
      console.error('Delete failed:', err);
      showToast('❌ Delete failed');
    }
  }

  async function handleSaveEdit(id: number | string, fieldName: string, value: string) {
    try {
      const res = await fetch(`/api/hub/colors/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [fieldName]: value }),
      });
      if (!res.ok) throw new Error(`Request failed with status ${res.status}`);
      showToast('✅ Updated successfully');
      setEditTarget(null);
      await refresh();
    } catch (err) {
      console.error('Edit save failed:', err);
      showToast('❌ Update failed');
    }
  }

  function toggleGroup(finish: string) {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(finish)) next.delete(finish);
      else next.add(finish);
      return next;
    });
  }

  const filteredColors = colors.filter((c) => {
    if (!search.trim()) return true;
    const q = search.trim().toLowerCase();
    return (
      c.color?.toLowerCase().includes(q) ||
      c.finish?.toLowerCase().includes(q) ||
      c.description?.toLowerCase().includes(q)
    );
  });

  const groupedByFinish = filteredColors.reduce<Record<string, ColorItem[]>>((acc, item) => {
    const key = item.finish || 'Unspecified';
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {});

  const sortedFinishKeys = Object.keys(groupedByFinish).sort();

  return (
    <div>
      {/* ADD FILAMENT FORM */}
      <form
        onSubmit={handleAddFilament}
        className="mb-6 flex flex-wrap items-end gap-4 rounded-xl border border-slate-800/80 bg-slate-900/70 p-4"
      >
        <div className="flex flex-col gap-1">
          <label className="text-[11px] font-semibold uppercase tracking-widest text-slate-500">Color Name</label>
          <input
            value={newColor}
            onChange={(e) => setNewColor(e.target.value)}
            placeholder="e.g. Galaxy Black"
            required
            className="rounded-lg border border-slate-800/80 bg-slate-950 px-3 py-2 text-sm text-slate-200 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-400"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-[11px] font-semibold uppercase tracking-widest text-slate-500">Finish</label>
          <select
            value={newFinish}
            onChange={(e) => handleFinishSelect(e.target.value)}
            className="rounded-lg border border-slate-800/80 bg-slate-950 px-3 py-2 text-sm text-slate-200 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-400"
          >
            {finishes.map((f) => (
              <option key={f} value={f}>
                {f}
              </option>
            ))}
            <option value={ADD_NEW_FINISH}>+ Add New Finish...</option>
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-[11px] font-semibold uppercase tracking-widest text-slate-500">Description</label>
          <input
            value={newDescription}
            onChange={(e) => setNewDescription(e.target.value)}
            placeholder="Optional notes"
            className="rounded-lg border border-slate-800/80 bg-slate-950 px-3 py-2 text-sm text-slate-200 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-400"
          />
        </div>

        <div className="flex gap-2">
          {[
            [newHex1, setNewHex1] as const,
            [newHex2, setNewHex2] as const,
            [newHex3, setNewHex3] as const,
          ].map(([val, setter], i) => (
            <div key={i} className="flex flex-col gap-1">
              <label className="text-[11px] font-semibold uppercase tracking-widest text-slate-500">Hex {i + 1}</label>
              <input
                type="color"
                value={val}
                onChange={(e) => setter(e.target.value)}
                className="h-9 w-11 cursor-pointer rounded-lg border border-slate-800/80 bg-slate-950 p-0.5"
              />
            </div>
          ))}
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="flex items-center gap-2 rounded-lg bg-sky-500 px-5 py-2.5 text-sm font-medium text-slate-950 transition-colors hover:not-disabled:bg-sky-600 focus:outline-none focus:ring-2 focus:ring-sky-400 disabled:opacity-60"
        >
          {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
          {submitting ? 'Adding...' : 'Add Filament'}
        </button>
      </form>

      {/* SEARCH */}
      <div className="relative mb-5 max-w-md">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by color, finish, or description..."
          className="w-full rounded-lg border border-slate-800/80 bg-slate-900/70 py-2.5 pl-10 pr-4 text-sm text-slate-200 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-400"
        />
      </div>

      {/* GROUPED LIST */}
      {loading ? (
        <div className="flex flex-col items-center gap-4 py-16 text-center text-slate-400">
          <Loader2 className="h-9 w-9 animate-spin text-slate-500" />
          <p className="text-sm">Loading inventory...</p>
        </div>
      ) : sortedFinishKeys.length === 0 ? (
        <div className="flex flex-col items-center gap-4 py-16 text-center text-slate-400">
          <Palette className="h-9 w-9 text-slate-500" />
          <p className="text-sm">No filaments found.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {sortedFinishKeys.map((finish) => {
            const items = groupedByFinish[finish];
            const isCollapsed = collapsed.has(finish);
            return (
              <div key={finish} className="overflow-hidden rounded-xl border border-slate-800/80 bg-slate-900/70">
                <button
                  onClick={() => toggleGroup(finish)}
                  className="flex w-full items-center justify-between bg-slate-950 px-4 py-3 text-left"
                >
                  <span className="text-[11px] font-semibold uppercase tracking-widest text-slate-500">
                    {finish} <span className="text-slate-500">({items.length})</span>
                  </span>
                  {isCollapsed ? (
                    <ChevronRight className="h-4 w-4 text-slate-500" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-slate-500" />
                  )}
                </button>

                {!isCollapsed && (
                  <div className="divide-y divide-slate-800/40">
                    {items.map((item) => {
                      const isPending = pendingStockIds.has(item.id);
                      return (
                        <div key={item.id} className="flex flex-wrap items-center gap-4 px-4 py-3">
                          <div className="flex gap-1">
                            {[item.colorHex1, item.colorHex2, item.colorHex3].map((hex, i) => (
                              <span
                                key={i}
                                className="h-6 w-6 rounded-full border border-white/20"
                                style={{ backgroundColor: hex || '#000000' }}
                              />
                            ))}
                          </div>

                          <button
                            onClick={() => setEditTarget({ id: item.id, fieldName: 'color', currentValue: item.color })}
                            className="min-w-[120px] text-left text-sm font-medium text-slate-200 hover:text-sky-400"
                            title="Click to edit color name"
                          >
                            {item.color}
                          </button>

                          {item.description && (
                            <span className="text-xs italic text-slate-400">{item.description}</span>
                          )}

                          <button
                            onClick={() => handleToggleStock(item)}
                            disabled={isPending}
                            className={`ml-auto flex items-center gap-1.5 rounded-full px-4 py-1.5 text-[11px] font-semibold uppercase tracking-widest transition-colors disabled:opacity-60 ${
                              item.inStock
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/40 hover:bg-emerald-500/20'
                                : 'bg-red-950 text-red-400 border border-red-800 hover:bg-red-900'
                            }`}
                          >
                            {isPending ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : item.inStock ? (
                              <CheckCircle2 className="h-3 w-3" />
                            ) : (
                              <XCircle className="h-3 w-3" />
                            )}
                            {isPending ? 'Updating' : item.inStock ? 'In Stock' : 'Out of Stock'}
                          </button>

                          <button
                            onClick={() => handleDelete(item)}
                            className="flex items-center gap-1.5 rounded-lg border border-red-800 bg-red-950 px-3 py-1.5 text-xs font-medium text-red-300 transition-colors hover:bg-red-900 hover:text-white"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            Delete
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <InvEditModal
        target={editTarget}
        availableFinishes={finishes}
        onClose={() => setEditTarget(null)}
        onSave={handleSaveEdit}
      />

      <div className="mt-9 pb-5 text-center text-xs text-slate-500">
        C3DW Workshop &mdash; Filament Inventory Manager
      </div>
    </div>
  );
}
