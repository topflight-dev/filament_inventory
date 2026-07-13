'use client';

/**
 * components/hub/InventoryManager.tsx — Filament Inventory Tab
 * ─────────────────────────────────────────────────────────────────────────────
 * Ported from hub.html's #inventory-tab-pane: add-filament form, finish
 * dropdown (+ "Add New Finish" prompt), collapsible finish-grouped list,
 * in-stock toggle (with optimistic pending-state), delete, and search filter.
 * Edits to color/finish are delegated to InvEditModal.
 * ─────────────────────────────────────────────────────────────────────────────
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
  deleteColor,
  getColors,
  getFinishes,
  insertColor,
  updateColorField,
  updateColorStock,
  type ColorItem,
} from '@/lib/supabase/hub-queries';
import InvEditModal, { type InvEditTarget } from './InvEditModal';

const ADD_NEW_FINISH = '__add_new__';

export default function InventoryManager({ showToast }: { showToast: (msg: string) => void }) {
  const supabase = useMemo(() => createClient(), []);
  const shopSlug = useMemo(
    () => (typeof window !== 'undefined' ? sessionStorage.getItem('c3dw_shop_slug') : null),
    []
  );

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
      const [colorData, finishData] = await Promise.all([
        getColors(supabase, shopSlug),
        getFinishes(supabase, shopSlug),
      ]);
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
  }, [supabase, shopSlug]);

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
      await insertColor(supabase, {
        color: newColor.trim(),
        finish: newFinish.trim(),
        description: newDescription.trim(),
        colorHex1: newHex1,
        colorHex2: newHex2,
        colorHex3: newHex3,
        inStock: true,
        shop_slug: shopSlug,
      });
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
      await updateColorStock(supabase, item.id, nextValue);
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
      await deleteColor(supabase, item.id);
      showToast('🗑️ Filament deleted');
      await refresh();
    } catch (err) {
      console.error('Delete failed:', err);
      showToast('❌ Delete failed');
    }
  }

  async function handleSaveEdit(id: number | string, fieldName: string, value: string) {
    try {
      await updateColorField(supabase, id, fieldName, value);
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
        className="mb-6 flex flex-wrap items-end gap-4 rounded-xl border border-zinc-800 bg-[#242424] p-4"
      >
        <div className="flex flex-col gap-1">
          <label className="text-xs font-bold uppercase tracking-wide text-zinc-500">Color Name</label>
          <input
            value={newColor}
            onChange={(e) => setNewColor(e.target.value)}
            placeholder="e.g. Galaxy Black"
            required
            className="rounded-lg border border-zinc-600 bg-black px-3 py-2 text-sm text-white outline-none focus:border-blue-500"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-bold uppercase tracking-wide text-zinc-500">Finish</label>
          <select
            value={newFinish}
            onChange={(e) => handleFinishSelect(e.target.value)}
            className="rounded-lg border border-zinc-600 bg-black px-3 py-2 text-sm text-white outline-none focus:border-blue-500"
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
          <label className="text-xs font-bold uppercase tracking-wide text-zinc-500">Description</label>
          <input
            value={newDescription}
            onChange={(e) => setNewDescription(e.target.value)}
            placeholder="Optional notes"
            className="rounded-lg border border-zinc-600 bg-black px-3 py-2 text-sm text-white outline-none focus:border-blue-500"
          />
        </div>

        <div className="flex gap-2">
          {[
            [newHex1, setNewHex1] as const,
            [newHex2, setNewHex2] as const,
            [newHex3, setNewHex3] as const,
          ].map(([val, setter], i) => (
            <div key={i} className="flex flex-col gap-1">
              <label className="text-xs font-bold uppercase tracking-wide text-zinc-500">Hex {i + 1}</label>
              <input
                type="color"
                value={val}
                onChange={(e) => setter(e.target.value)}
                className="h-9 w-11 cursor-pointer rounded-lg border border-zinc-600 bg-black p-0.5"
              />
            </div>
          ))}
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="rounded-lg bg-blue-500 px-5 py-2.5 text-sm font-bold text-white transition-colors hover:not-disabled:bg-blue-600 disabled:opacity-60"
        >
          {submitting ? '⏳ Adding...' : '➕ Add Filament'}
        </button>
      </form>

      {/* SEARCH */}
      <div className="mb-5">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="🔍 Search by color, finish, or description..."
          className="w-full max-w-md rounded-lg border border-zinc-700 bg-[#242424] px-4 py-2.5 text-sm text-white outline-none focus:border-blue-500"
        />
      </div>

      {/* GROUPED LIST */}
      {loading ? (
        <div className="py-16 text-center text-zinc-500">
          <span className="mb-4 block text-5xl">⏳</span>
          <p className="text-lg">Loading inventory...</p>
        </div>
      ) : sortedFinishKeys.length === 0 ? (
        <div className="py-16 text-center text-zinc-500">
          <span className="mb-4 block text-5xl">🎨</span>
          <p className="text-lg">No filaments found.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {sortedFinishKeys.map((finish) => {
            const items = groupedByFinish[finish];
            const isCollapsed = collapsed.has(finish);
            return (
              <div key={finish} className="overflow-hidden rounded-xl border border-zinc-800 bg-[#242424]">
                <button
                  onClick={() => toggleGroup(finish)}
                  className="flex w-full items-center justify-between bg-[#1f1f1f] px-4 py-3 text-left"
                >
                  <span className="text-sm font-bold uppercase tracking-wide text-zinc-300">
                    {finish} <span className="text-zinc-500">({items.length})</span>
                  </span>
                  <span className="text-zinc-500">{isCollapsed ? '▸' : '▾'}</span>
                </button>

                {!isCollapsed && (
                  <div className="divide-y divide-white/5">
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
                            className="min-w-[120px] text-left text-sm font-bold text-white hover:text-blue-400"
                            title="Click to edit color name"
                          >
                            {item.color}
                          </button>

                          {item.description && (
                            <span className="text-xs italic text-zinc-500">{item.description}</span>
                          )}

                          <button
                            onClick={() => handleToggleStock(item)}
                            disabled={isPending}
                            className={`ml-auto rounded-full px-4 py-1.5 text-xs font-extrabold uppercase tracking-wider transition-colors disabled:opacity-60 ${
                              item.inStock
                                ? 'bg-emerald-950 text-emerald-400 border border-emerald-800 hover:bg-emerald-900'
                                : 'bg-red-950 text-red-400 border border-red-800 hover:bg-red-900'
                            }`}
                          >
                            {isPending ? '⏳' : item.inStock ? '✅ In Stock' : '❌ Out of Stock'}
                          </button>

                          <button
                            onClick={() => handleDelete(item)}
                            className="rounded-lg border border-red-800 bg-red-950 px-3 py-1.5 text-xs font-bold text-red-300 transition-colors hover:bg-red-900 hover:text-white"
                          >
                            🗑️ Delete
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

      <div className="mt-9 pb-5 text-center text-sm text-zinc-600">
        C3DW Workshop &mdash; Filament Inventory Manager
      </div>
    </div>
  );
}
