'use client';

/**
 * components/hub/NotificationSettingsModal.tsx — Per-Shop Notification Settings
 * ─────────────────────────────────────────────────────────────────────────────
 * Reachable only from within the already-authenticated Hub (HubShell's
 * sidebar footer, next to Change Passcode). Lets a shop configure where its
 * own print-request alerts go: a notification email (sent via Resend) and/or
 * a Discord webhook URL — both independent and optional. shop_slug is never
 * sent from the client; it's derived server-side from the session cookie
 * (see /api/hub/notification-settings). Loads current settings on open via
 * GET, saves both fields together via PATCH.
 *
 * UPDATED 2026-09-26 (visual redesign, phase 2): neutral light SaaS theme —
 * matches ChangePasscodeModal.tsx / ShareLinkModal.tsx exactly. See
 * HubShell.tsx's header comment for the full reasoning.
 * ─────────────────────────────────────────────────────────────────────────────
 */
import { useEffect, useState } from 'react';
import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';

export default function NotificationSettingsModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [notificationEmail, setNotificationEmail] = useState('');
  const [discordWebhookUrl, setDiscordWebhookUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;

    async function loadSettings() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch('/api/hub/notification-settings');
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data?.error || 'Failed to load settings');
        if (!cancelled) {
          setNotificationEmail(data.notificationEmail ?? '');
          setDiscordWebhookUrl(data.discordWebhookUrl ?? '');
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load settings');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadSettings();
    return () => {
      cancelled = true;
    };
  }, [open]);

  if (!open) return null;

  function handleClose() {
    setError(null);
    setSuccess(null);
    onClose();
  }

  async function handleSave() {
    setError(null);
    setSuccess(null);
    setSaving(true);
    try {
      const res = await fetch('/api/hub/notification-settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          notificationEmail: notificationEmail.trim(),
          discordWebhookUrl: discordWebhookUrl.trim(),
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data?.error || 'Failed to save notification settings.');
        return;
      }

      setSuccess('Notification settings saved.');
      setTimeout(() => {
        setSuccess(null);
        onClose();
      }, 1500);
    } catch {
      setError('Failed to save notification settings.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-zinc-900/40 backdrop-blur-sm">
      <div className="w-[90%] max-w-[440px] rounded-xl border border-zinc-200 bg-white p-7 text-zinc-500 shadow-xl">
        <h3 className="mb-1 text-[11px] font-semibold uppercase tracking-widest text-zinc-400">
          Notification Settings
        </h3>
        <p className="mb-4 text-xs leading-relaxed text-zinc-500">
          Get alerted when a customer submits a new print request. Both channels are optional —
          set either, both, or neither.
        </p>

        {loading ? (
          <p className="py-6 text-center text-xs italic text-zinc-400">Loading…</p>
        ) : (
          <>
            <label className="mb-1 block text-xs font-medium text-zinc-500">
              Notification Email <span className="font-normal text-zinc-400">(optional)</span>
            </label>
            <input
              type="email"
              value={notificationEmail}
              onChange={(e) => setNotificationEmail(e.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
              spellCheck={false}
              className="mb-3.5 block w-full rounded-lg border border-zinc-300 bg-white px-3.5 py-2.5 text-sm text-zinc-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30"
            />

            <label className="mb-1 block text-xs font-medium text-zinc-500">
              Discord Webhook URL <span className="font-normal text-zinc-400">(optional)</span>
            </label>
            <input
              type="text"
              value={discordWebhookUrl}
              onChange={(e) => setDiscordWebhookUrl(e.target.value)}
              placeholder="https://discord.com/api/webhooks/..."
              spellCheck={false}
              className="mb-1.5 block w-full rounded-lg border border-zinc-300 bg-white px-3.5 py-2.5 text-sm text-zinc-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30"
            />
            <p className="mb-2 text-[11px] leading-relaxed text-zinc-400">
              In Discord: Server Settings → Integrations → Webhooks → New Webhook → Copy Webhook URL.
            </p>
          </>
        )}

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
            disabled={saving || loading}
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
