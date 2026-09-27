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
 * Visual palette matches InvEditModal.tsx exactly: "Deep Oceanic Stealth"
 * theme — same overlay/backdrop, frosted navy slate panel
 * (bg-slate-900/70, border-slate-800/80, rounded-xl), vibrant cyan
 * (sky-500) primary action with dark text for max contrast,
 * slate-200/slate-400 typography hierarchy.
 * ─────────────────────────────────────────────────────────────────────────────
 */
import { useState } from 'react';
import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';

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

  if (!open) return null;

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
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/70">
      <div className="w-[90%] max-w-[420px] rounded-xl border border-slate-800/80 bg-slate-900/70 p-7 text-slate-400 shadow-2xl">
        <h3 className="mb-4 text-[11px] font-semibold uppercase tracking-widest text-slate-500">
          Change Passcode
        </h3>

        <label className="mb-1 block text-xs font-medium text-slate-400">Current Passcode</label>
        <input
          type="password"
          value={currentPasscode}
          onChange={(e) => setCurrentPasscode(e.target.value)}
          autoComplete="current-password"
          spellCheck={false}
          className="mb-3.5 block w-full rounded-lg border border-slate-800/80 bg-slate-950 px-3.5 py-2.5 text-sm text-slate-200 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-400"
        />

        <label className="mb-1 block text-xs font-medium text-slate-400">New Passcode</label>
        <input
          type="password"
          value={newPasscode}
          onChange={(e) => setNewPasscode(e.target.value)}
          autoComplete="new-password"
          spellCheck={false}
          className="mb-3.5 block w-full rounded-lg border border-slate-800/80 bg-slate-950 px-3.5 py-2.5 text-sm text-slate-200 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-400"
        />

        <label className="mb-1 block text-xs font-medium text-slate-400">Confirm New Passcode</label>
        <input
          type="password"
          value={confirmPasscode}
          onChange={(e) => setConfirmPasscode(e.target.value)}
          autoComplete="new-password"
          spellCheck={false}
          className="mb-2 block w-full rounded-lg border border-slate-800/80 bg-slate-950 px-3.5 py-2.5 text-sm text-slate-200 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-400"
        />

        {error && (
          <p className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-red-400">
            <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
            {error}
          </p>
        )}
        {success && (
          <p className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-emerald-400">
            <CheckCircle2 className="h-3.5 w-3.5 flex-shrink-0" />
            {success}
          </p>
        )}

        <div className="mt-5 flex gap-2.5">
          <button
            type="button"
            onClick={handleClose}
            className="rounded-lg border border-slate-800/80 bg-slate-950 px-4.5 py-2.5 text-sm font-medium text-slate-400 transition-colors hover:bg-slate-800/40"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 rounded-lg bg-sky-500 px-4.5 py-2.5 text-sm font-medium text-slate-950 transition-colors hover:not-disabled:bg-sky-600 focus:outline-none focus:ring-2 focus:ring-sky-400 disabled:opacity-60"
          >
            {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}
