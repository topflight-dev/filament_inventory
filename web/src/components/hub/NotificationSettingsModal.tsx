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
 *
 * UPDATED 2026-09-26 (phase 3): migrated onto the shared Modal/Input/Button
 * kit and swapped the plain "Loading…" text for a Skeleton placeholder shaped
 * like the two fields it's about to reveal.
 * ─────────────────────────────────────────────────────────────────────────────
 */
import { useEffect, useState } from 'react';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import Skeleton from '@/components/ui/Skeleton';

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
    <Modal
      open={open}
      onClose={handleClose}
      title="Notification Settings"
      description="Get alerted when a customer submits a new print request. Both channels are optional — set either, both, or neither."
      footer={
        <>
          <Button type="button" variant="secondary" onClick={handleClose}>
            Cancel
          </Button>
          <Button type="button" onClick={handleSave} loading={saving || loading}>
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </>
      }
    >
      {loading ? (
        <div className="space-y-3.5 py-1">
          <div>
            <Skeleton className="mb-1.5 h-3 w-40" />
            <Skeleton className="h-10 w-full" />
          </div>
          <div>
            <Skeleton className="mb-1.5 h-3 w-40" />
            <Skeleton className="h-10 w-full" />
          </div>
        </div>
      ) : (
        <>
          <label className="mb-1 block text-xs font-medium text-zinc-500">
            Notification Email <span className="font-normal text-zinc-400">(optional)</span>
          </label>
          <Input
            type="email"
            value={notificationEmail}
            onChange={(e) => setNotificationEmail(e.target.value)}
            placeholder="you@example.com"
            autoComplete="email"
            spellCheck={false}
            className="mb-3.5"
          />

          <label className="mb-1 block text-xs font-medium text-zinc-500">
            Discord Webhook URL <span className="font-normal text-zinc-400">(optional)</span>
          </label>
          <Input
            type="text"
            value={discordWebhookUrl}
            onChange={(e) => setDiscordWebhookUrl(e.target.value)}
            placeholder="https://discord.com/api/webhooks/..."
            spellCheck={false}
            className="mb-1.5"
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
    </Modal>
  );
}
