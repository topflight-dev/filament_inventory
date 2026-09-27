'use client';

/**
 * components/hub/ChangePasscodeModal.tsx — Self-Service Passcode Change Modal
 * ─────────────────────────────────────────────────────────────────────────────
 * Reachable only from within the already-authenticated Hub (HubShell's
 * sidebar footer). Posts { currentPasscode, newPasscode } to
 * /api/hub/change-passcode — shop_slug is never sent, it's derived
 * server-side from the session cookie. Manages its own inline
 * success/error messaging (styled like AuthGate's error text) rather than
 * depending on the app's toast system, to keep this self-contained.
 *
 * UPDATED 2026-09-26 (visual redesign, phase 2): neutral light SaaS theme —
 * see HubShell.tsx's header comment for the full reasoning. White panel on
 * a neutral dark scrim, zinc borders, indigo accent.
 *
 * UPDATED 2026-09-26 (phase 3): migrated onto the shared Modal/Input/Button
 * kit (components/ui/*) — same markup and behavior, now centrally styled
 * and with the animated open/close that came with Modal.tsx.
 * ─────────────────────────────────────────────────────────────────────────────
 */
import { useState } from 'react';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';

export default function ChangePasscodeModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [currentPasscode, setCurrentPasscode] = useState('');
  const [newPasscode, setNewPasscode] = useState('');
  const [confirmPasscode, setConfirmPasscode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function resetFields() {
    setCurrentPasscode('');
    setNewPasscode('');
    setConfirmPasscode('');
  }

  function handleClose() {
    setError(null);
    setSuccess(null);
    resetFields();
    onClose();
  }

  async function handleSave() {
    setError(null);
    setSuccess(null);

    if (newPasscode !== confirmPasscode) {
      setError('New passcode and confirmation do not match.');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('/api/hub/change-passcode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPasscode, newPasscode }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data?.error || 'Failed to change passcode. Please try again.');
        return;
      }

      setSuccess('Passcode changed successfully.');
      resetFields();
      setTimeout(() => {
        setSuccess(null);
        onClose();
      }, 1500);
    } catch {
      setError('Failed to change passcode. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Change Passcode"
      maxWidth="max-w-[420px]"
      footer={
        <>
          <Button type="button" variant="secondary" onClick={handleClose}>
            Cancel
          </Button>
          <Button type="button" onClick={handleSave} loading={saving}>
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </>
      }
    >
      <label className="mb-1 block text-xs font-medium text-zinc-500">Current Passcode</label>
      <Input
        type="password"
        value={currentPasscode}
        onChange={(e) => setCurrentPasscode(e.target.value)}
        autoComplete="current-password"
        spellCheck={false}
        className="mb-3.5"
      />

      <label className="mb-1 block text-xs font-medium text-zinc-500">New Passcode</label>
      <Input
        type="password"
        value={newPasscode}
        onChange={(e) => setNewPasscode(e.target.value)}
        autoComplete="new-password"
        spellCheck={false}
        className="mb-3.5"
      />

      <label className="mb-1 block text-xs font-medium text-zinc-500">Confirm New Passcode</label>
      <Input
        type="password"
        value={confirmPasscode}
        onChange={(e) => setConfirmPasscode(e.target.value)}
        autoComplete="new-password"
        spellCheck={false}
        className="mb-2"
      />

      {error && (
        <p className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-red-600">
          <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
          {error}
        </p>
      )}
      {success && (
        <p className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-emerald-600">
          <CheckCircle2 className="h-3.5 w-3.5 flex-shrink-0" />
          {success}
        </p>
      )}
    </Modal>
  );
}
