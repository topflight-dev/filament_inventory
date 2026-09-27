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
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-zinc-900/40 backdrop-blur-sm">
      <div className="w-[90%] max-w-[420px] rounded-xl border border-zinc-200 bg-white p-7 text-zinc-500 shadow-xl">
        <h3 className="mb-4 text-[11px] font-semibold uppercase tracking-widest text-zinc-400">
          Change Passcode
        </h3>

        <label className="mb-1 block text-xs font-medium text-zinc-500">Current Passcode</label>
        <input
          type="password"
          value={currentPasscode}
          onChange={(e) => setCurrentPasscode(e.target.value)}
          autoComplete="current-password"
          spellCheck={false}
          className="mb-3.5 block w-full rounded-lg border border-zinc-300 bg-white px-3.5 py-2.5 text-sm text-zinc-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30"
        />

        <label className="mb-1 block text-xs font-medium text-zinc-500">New Passcode</label>
        <input
          type="password"
          value={newPasscode}
          onChange={(e) => setNewPasscode(e.target.value)}
          autoComplete="new-password"
          spellCheck={false}
          className="mb-3.5 block w-full rounded-lg border border-zinc-300 bg-white px-3.5 py-2.5 text-sm text-zinc-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30"
        />

        <label className="mb-1 block text-xs font-medium text-zinc-500">Confirm New Passcode</label>
        <input
          type="password"
          value={confirmPasscode}
          onChange={(e) => setConfirmPasscode(e.target.value)}
          autoComplete="new-password"
          spellCheck={false}
          className="mb-2 block w-full rounded-lg border border-zinc-300 bg-white px-3.5 py-2.5 text-sm text-zinc-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30"
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

        <div className="mt-5 flex gap-2.5">
          <button
            type="button"
            onClick={handleClose}
            className="rounded-lg border border-zinc-300 bg-white px-4.5 py-2.5 text-sm font-medium text-zinc-500 transition-colors hover:bg-zinc-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4.5 py-2.5 text-sm font-medium text-white transition-colors hover:not-disabled:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 disabled:opacity-60"
          >
            {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}
