'use client';

/**
 * components/hub/InvEditModal.tsx — Color/Finish Edit Modal
 * ─────────────────────────────────────────────────────────────────────────────
 * Ported from hub.html's #invEditModal / openInvEditModal(). Renders either a
 * text input (color field) or a <select> populated from availableFinishes
 * (finish field), matching the legacy behavior exactly.
 *
 * Visual palette: "Deep Oceanic Stealth" theme — frosted navy slate panel
 * (bg-slate-900/70, border-slate-800/80, rounded-xl), vibrant cyan (sky-500)
 * primary action with dark text for max contrast, slate-200/slate-400
 * typography hierarchy.
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
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/70">
      <div className="w-[90%] max-w-[420px] rounded-xl border border-slate-800/80 bg-slate-900/70 p-7 text-slate-400 shadow-2xl">
        <h3 className="mb-4 text-[11px] font-semibold uppercase tracking-widest text-slate-500">
          Edit {target.fieldName.charAt(0).toUpperCase() + target.fieldName.slice(1)}
        </h3>

        {target.fieldName === 'finish' ? (
          <select
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="mt-2 block w-full rounded-lg border border-slate-800/80 bg-slate-950 px-3.5 py-2.5 text-sm text-slate-200 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-400"
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
            className="mt-2 block w-full rounded-lg border border-slate-800/80 bg-slate-950 px-3.5 py-2.5 text-sm text-slate-200 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-400"
          />
        )}

        <div className="mt-5 flex gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-800/80 bg-slate-950 px-4.5 py-2.5 text-sm font-medium text-slate-400 transition-colors hover:bg-slate-800/40"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="rounded-lg bg-sky-500 px-4.5 py-2.5 text-sm font-medium text-slate-950 transition-colors hover:not-disabled:bg-sky-600 focus:outline-none focus:ring-2 focus:ring-sky-400 disabled:opacity-60"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}
