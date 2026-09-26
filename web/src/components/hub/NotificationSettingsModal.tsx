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
 * Visual palette matches ChangePasscodeModal.tsx / InvEditModal.tsx exactly:
 * "Deep Oceanic Stealth" theme — same overlay/backdrop, frosted navy slate
 * panel, vibrant cyan (sky-500) primary action, slate-200/slate-400/slate-500
 * text hierarchy.
 * ─────────────────────────────────────────────────────────────────────────────
 */
import { useEffect, useState } from 'react';

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

      setSuccess('✅ Notification settings saved.');
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
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/70">
      <div className="w-[90%] max-w-[440px] rounded-xl border border-slate-800/80 bg-slate-900/70 p-7 text-slate-400 shadow-2xl">
        <h3 className="mb-1 text-[11px] font-semibold uppercase tracking-widest text-slate-500">
          Notification Settings
        </h3>
        <p className="mb-4 text-xs leading-relaxed text-slate-500">
          Get alerted when a customer submits a new print request. Both channels are optional —
          set either, both, or neither.
        </p>

        {loading ? (
          <p className="py-6 text-center text-xs italic text-slate-500">Loading…</p>
        ) : (
          <>
            <label className="mb-1 block text-xs font-medium text-slate-400">
              Notification Email <span className="font-normal text-slate-500">(optional)</span>
            </label>
            <input
              type="email"
              value={notificationEmail}
              onChange={(e) => setNotificationEmail(e.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
              spellCheck={false}
              className="mb-3.5 block w-full rounded-lg border border-slate-800/80 bg-slate-950 px-3.5 py-2.5 text-sm text-slate-200 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-400"
            />

            <label className="mb-1 block text-xs font-medium text-slate-400">
              Discord Webhook URL <span className="font-normal text-slate-500">(optional)</span>
            </label>
            <input
              type="text"
              value={discordWebhookUrl}
              onChange={(e) => setDiscordWebhookUrl(e.target.value)}
              placeholder="https://discord.com/api/webhooks/..."
              spellCheck={false}
              className="mb-1.5 block w-full rounded-lg border border-slate-800/80 bg-slate-950 px-3.5 py-2.5 text-sm text-slate-200 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-400"
            />
            <p className="mb-2 text-[11px] leading-relaxed text-slate-500">
              In Discord: Server Settings → Integrations → Webhooks → New Webhook → Copy Webhook URL.
            </p>
          </>
        )}

        {error && <p className="mt-2 text-xs font-semibold text-red-400">❌ {error}</p>}
        {success && <p className="mt-2 text-xs font-semibold text-emerald-400">{success}</p>}

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
            disabled={saving || loading}
            className="rounded-lg bg-sky-500 px-4.5 py-2.5 text-sm font-medium text-slate-950 transition-colors hover:not-disabled:bg-sky-600 focus:outline-none focus:ring-2 focus:ring-sky-400 disabled:opacity-60"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}
