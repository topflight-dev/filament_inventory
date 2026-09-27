'use client';

/**
 * components/hub/InventoryManager.tsx — Filament Inventory Tab
 * ─────────────────────────────────────────────────────────────────────────────
 * Ported from hub.html's #inventory-tab-pane: add-filament form, finish
 * dropdown (+ "Add New Finish" prompt), collapsible finish-grouped list,
 * in-stock toggle (with optimistic pending-state), delete, and search filter.
 * Edits to color/finish are delegated to InvEditModal.
 *
 * UPDATED 2026-09-26 (icon pass): emoji icons replaced with lucide-react.
 *
 * UPDATED 2026-09-26 (visual redesign, phase 2): neutral light SaaS theme —
 * see HubShell.tsx's header comment for the full reasoning. "In Stock" stays
 * emerald as the one functional exception to the single-accent rule, since
 * stock state needs to be scannable at a glance across a long list.
 *
 * UPDATED 2026-09-26 (phase 3): migrated the add-filament form and search box
 * onto the shared Input/Select components, the stock toggle and delete
 * controls onto Button, and replaced the spinner-only "Loading inventory..."
 * fallback with Skeleton group cards shaped like the real finish-grouped list.
 * ─────────────────────────────────────────────────────────────────────────────
 */
import { useCallback, useEffect, useState } from 'react';
import {
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Palette,
  Plus,
  Search,
  Trash2,
  XCircle,
} from 'lucide-react';
import { type ColorItem } from '@/lib/supabase/hub-queries';
import InvEditModal, { type InvEditTarget } from './InvEditModal';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Button from '@/components/ui/Button';
import Skeleton from '@/components/ui/Skeleton';

const ADD_NEW_FINISH = '__add_new__';

function SkeletonGroup() {
  return (
    <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm">
      <div className="flex items-center justify-between bg-zinc-50 px-4 py-3">
        <Skeleton className="h-3 w-28" />
        <Skeleton className="h-4 w-4" />
      </div>
      <div className="divide-y divide-zinc-100">
        {[0, 1].map((i) => (
          <div key={i} className="flex flex-wrap items-center gap-4 px-4 py-3">
            <div className="flex gap-1">
              <Skeleton className="h-6 w-6 rounded-full" />
              <Skeleton className="h-6 w-6 rounded-full" />
              <Skeleton className="h-6 w-6 rounded-full" />
            </div>
            <Skeleton className="h-4 w-28" />
            <Skeleton className="ml-auto h-6 w-24 rounded-full" />
            <Skeleton className="h-7 w-20 rounded-lg" />
          </div>
        ))}
      </div>
    </div>
  );
}

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
        className="mb-6 flex flex-wrap items-end gap-4 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm"
      >
        <div className="flex flex-col gap-1">
          <label className="text-[11px] font-semibold uppercase tracking-widest text-zinc-400">Color Name</label>
          <Input
            value={newColor}
            onChange={(e) => setNewColor(e.target.value)}
            placeholder="e.g. Galaxy Black"
            required
            className="!py-2"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-[11px] font-semibold uppercase tracking-widest text-zinc-400">Finish</label>
          <Select value={newFinish} onChange={(e) => handleFinishSelect(e.target.value)} className="!py-2">
            {finishes.map((f) => (
              <option key={f} value={f}>
                {f}
              </option>
            ))}
            <option value={ADD_NEW_FINISH}>+ Add New Finish...</option>
          </Select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-[11px] font-semibold uppercase tracking-widest text-zinc-400">Description</label>
          <Input
            value={newDescription}
            onChange={(e) => setNewDescription(e.target.value)}
            placeholder="Optional notes"
            className="!py-2"
          />
        </div>

        <div className="flex gap-2">
          {[
            [newHex1, setNewHex1] as const,
            [newHex2, setNewHex2] as const,
            [newHex3, setNewHex3] as const,
          ].map(([val, setter], i) => (
            <div key={i} className="flex flex-col gap-1">
              <label className="text-[11px] font-semibold uppercase tracking-widest text-zinc-400">Hex {i + 1}</label>
              <input
                type="color"
                value={val}
                onChange={(e) => setter(e.target.value)}
                className="h-9 w-11 cursor-pointer rounded-lg border border-zinc-300 bg-white p-0.5"
              />
            </div>
          ))}
        </div>

        <Button type="submit" loading={submitting} icon={Plus} variant="primary">
          {submitting ? 'Adding...' : 'Add Filament'}
        </Button>
      </form>

      {/* SEARCH */}
      <div className="mb-5 max-w-md">
        <Input
          icon={Search}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by color, finish, or description..."
        />
      </div>

      {/* GROUPED LIST */}
      {loading ? (
        <div className="flex flex-col gap-4">
          <SkeletonGroup />
          <SkeletonGroup />
        </div>
      ) : sortedFinishKeys.length === 0 ? (
        <div className="flex flex-col items-center gap-4 py-16 text-center text-zinc-400">
          <Palette className="h-9 w-9 text-zinc-300" />
          <p className="text-sm">No filaments found.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {sortedFinishKeys.map((finish) => {
            const items = groupedByFinish[finish];
            const isCollapsed = collapsed.has(finish);
            return (
              <div key={finish} className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm">
                <button
                  onClick={() => toggleGroup(finish)}
                  className="flex w-full items-center justify-between bg-zinc-50 px-4 py-3 text-left"
                >
                  <span className="text-[11px] font-semibold uppercase tracking-widest text-zinc-500">
                    {finish} <span className="text-zinc-400">({items.length})</span>
                  </span>
                  {isCollapsed ? (
                    <ChevronRight className="h-4 w-4 text-zinc-400" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-zinc-400" />
                  )}
                </button>

                {!isCollapsed && (
                  <div className="divide-y divide-zinc-100">
                    {items.map((item) => {
                      const isPending = pendingStockIds.has(item.id);
                      return (
                        <div key={item.id} className="flex flex-wrap items-center gap-4 px-4 py-3">
                          <div className="flex gap-1">
                            {[item.colorHex1, item.colorHex2, item.colorHex3].map((hex, i) => (
                              <span
                                key={i}
                                className="h-6 w-6 rounded-full border border-zinc-200"
                                style={{ backgroundColor: hex || '#000000' }}
                              />
                            ))}
                          </div>

                          <button
                            onClick={() => setEditTarget({ id: item.id, fieldName: 'color', currentValue: item.color })}
                            className="min-w-[120px] text-left text-sm font-medium text-zinc-900 hover:text-indigo-600"
                            title="Click to edit color name"
                          >
                            {item.color}
                          </button>

                          {item.description && (
                            <span className="text-xs italic text-zinc-500">{item.description}</span>
                          )}

                          <Button
                            onClick={() => handleToggleStock(item)}
                            loading={isPending}
                            icon={item.inStock ? CheckCircle2 : XCircle}
                            variant={item.inStock ? 'success' : 'destructive'}
                            size="sm"
                            className="ml-auto !rounded-full !uppercase !tracking-widest"
                          >
                            {isPending ? 'Updating' : item.inStock ? 'In Stock' : 'Out of Stock'}
                          </Button>

                          <Button onClick={() => handleDelete(item)} icon={Trash2} variant="destructive" size="sm">
                            Delete
                          </Button>
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

      <div className="mt-9 pb-5 text-center text-xs text-zinc-400">
        C3DW Workshop &mdash; Filament Inventory Manager
      </div>
    </div>
  );
}
