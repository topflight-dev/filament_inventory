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
 *
 * UPDATED 2026-09-26 (phase 3): migrated onto the shared Modal/Input/Select/
 * Button kit.
 * ─────────────────────────────────────────────────────────────────────────────
 */
import { useEffect, useState } from 'react';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Button from '@/components/ui/Button';

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
    <Modal
      open={!!target}
      onClose={onClose}
      title={target ? `Edit ${target.fieldName.charAt(0).toUpperCase() + target.fieldName.slice(1)}` : ''}
      maxWidth="max-w-[420px]"
      footer={
        <>
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="button" onClick={handleSave} loading={saving}>
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </>
      }
    >
      {target?.fieldName === 'finish' ? (
        <Select value={value} onChange={(e) => setValue(e.target.value)} className="mt-2">
          {availableFinishes.map((f) => (
            <option key={f} value={f}>
              {f}
            </option>
          ))}
        </Select>
      ) : (
        <Input type="text" value={value} onChange={(e) => setValue(e.target.value)} className="mt-2" />
      )}
    </Modal>
  );
}
