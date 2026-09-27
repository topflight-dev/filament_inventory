'use client';

/**
 * components/hub/InvEditModal.tsx — Color/Finish Edit Modal
 * ─────────────────────────────────────────────────────────────────────────────
 * Ported from hub.html's #invEditModal / openInvEditModal(). Renders either a
 * text input (color field) or a <select> populated from availableFinishes
 * (finish field), matching the legacy behavior exactly.
 *
 * UPDATED 2026-09-26 (visual redesign, phase 2): neutral light SaaS theme —
 * see HubShell.tsx's header comment for the full reasoning. This was the one
 * Hub file still on the old dark palette (it had no emoji, so it was missed
 * by the earlier icon pass) — now matches every other modal.
 * ─────────────────────────────────────────────────────────────────────────────
 */
import { useEffect, useState } from 'react';

export type InvEditTarget = {
  id: number | string;
  fieldName: 'color' | 'finish';
  currentValue: string;
};

export default function InvEditModal({
  target,
  availableFinishes,
  onClose,
  onSave,
}: {
  target: InvEditTarget | null;
  availableFinishes: string[];
  onClose: () => void;
  onSave: (id: number | string, fieldName: string, value: string) => Promise<void>;
}) {
  const [value, setValue] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (target) setValue(target.currentValue);
  }, [target]);

  if (!target) return null;

  async function handleSave() {
    if (!value || value.trim() === '' || !target) return;
    setSaving(true);
    try {
      await onSave(target.id, target.fieldName, value.trim());
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-zinc-900/40 backdrop-blur-sm">
      <div className="w-[90%] max-w-[420px] rounded-xl border border-zinc-200 bg-white p-7 text-zinc-500 shadow-xl">
        <h3 className="mb-4 text-[11px] font-semibold uppercase tracking-widest text-zinc-400">
          Edit {target.fieldName.charAt(0).toUpperCase() + target.fieldName.slice(1)}
        </h3>

        {target.fieldName === 'finish' ? (
          <select
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="mt-2 block w-full rounded-lg border border-zinc-300 bg-white px-3.5 py-2.5 text-sm text-zinc-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30"
          >
            {availableFinishes.map((f) => (
              <option key={f} value={f}>
                {f}
              </option>
            ))}
          </select>
        ) : (
          <input
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="mt-2 block w-full rounded-lg border border-zinc-300 bg-white px-3.5 py-2.5 text-sm text-zinc-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30"
          />
        )}

        <div className="mt-5 flex gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-zinc-300 bg-white px-4.5 py-2.5 text-sm font-medium text-zinc-500 transition-colors hover:bg-zinc-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="rounded-lg bg-indigo-600 px-4.5 py-2.5 text-sm font-medium text-white transition-colors hover:not-disabled:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 disabled:opacity-60"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}
