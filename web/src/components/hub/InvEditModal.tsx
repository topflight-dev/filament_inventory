'use client';

/**
 * components/hub/InvEditModal.tsx — Color/Finish Edit Modal
 * ─────────────────────────────────────────────────────────────────────────────
 * Ported from hub.html's #invEditModal / openInvEditModal(). Renders either a
 * text input (color field) or a <select> populated from availableFinishes
 * (finish field), matching the legacy behavior exactly.
 *
 * Visual palette: "Deep Navy & Slate Gray" theme — slate gray panel
 * (#1E293B, border-slate-700/60, rounded-xl), indigo (#4F46E5) primary
 * action, crisp white (#F1F5F9)/muted slate (#94A3B8) typography.
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
      <div className="w-[90%] max-w-[420px] rounded-xl border border-slate-700/60 bg-[#1E293B] p-7 text-[#94A3B8] shadow-2xl">
        <h3 className="mb-4 text-sm font-bold uppercase tracking-wide text-[#94A3B8]">
          Edit {target.fieldName.charAt(0).toUpperCase() + target.fieldName.slice(1)}
        </h3>

        {target.fieldName === 'finish' ? (
          <select
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="mt-2 block w-full rounded-lg border border-slate-700/60 bg-[#0F172A] px-3.5 py-2.5 text-sm text-[#F1F5F9] outline-none focus:border-[#4F46E5]"
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
            className="mt-2 block w-full rounded-lg border border-slate-700/60 bg-[#0F172A] px-3.5 py-2.5 text-sm text-[#F1F5F9] outline-none focus:border-[#4F46E5]"
          />
        )}

        <div className="mt-5 flex gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-700/60 bg-[#0F172A] px-4.5 py-2.5 text-sm font-bold text-[#94A3B8] transition-colors hover:bg-slate-700/40"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="rounded-lg bg-[#4F46E5] px-4.5 py-2.5 text-sm font-bold text-white transition-colors hover:not-disabled:bg-[#4338CA] disabled:opacity-60"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}
