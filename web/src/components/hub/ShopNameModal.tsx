'use client';

/**
 * components/hub/ShopNameModal.tsx — Shop Name (self-service + first-login prompt)
 * ─────────────────────────────────────────────────────────────────────────────
 * Added 2026-09-26. Closes a real gap in the Hub: shop_name previously only
 * ever got set by Luis directly in Supabase when he created a shop row by
 * hand — there was no way for a shop owner to set or change it themselves,
 * so it silently stayed blank for any shop that came in any other way (the
 * sidebar already had code ready to display it, just nothing to show). This
 * one component is used two ways:
 *
 *   - Editable anytime, opened from the sidebar footer ("Shop Name"), same
 *     pattern as Change Passcode / Notifications — dismissable, prefilled
 *     with the shop's current name via GET on open.
 *   - Mandatory on first login (`mandatory` prop, driven by hub/page.tsx
 *     finding no shop_name on the session) — disables the scrim-click and
 *     drops the Cancel button, so the dashboard can't be dismissed without
 *     saving a name. Skips the GET entirely in this mode since an empty
 *     name is the whole reason it's showing.
 *
 * PATCH /api/hub/shop-profile also re-signs the session cookie with the new
 * name, so it shows up immediately (sidebar, etc.) without a fresh login —
 * this component just calls `onSaved` with the trimmed name so the parent
 * can update what it's already holding in state.
 * ─────────────────────────────────────────────────────────────────────────────
 */
import { useEffect, useState } from 'react';
import { AlertCircle, Store } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import Skeleton from '@/components/ui/Skeleton';

export default function ShopNameModal({
  open,
  mandatory = false,
  onClose,
  onSaved,
}: {
  open: boolean;
  mandatory?: boolean;
  onClose?: () => void;
  onSaved: (shopName: string) => void;
}) {
  const [loading, setLoading] = useState(!mandatory);
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;

    if (mandatory) {
      // Nothing to prefill — a missing name is why this is showing.
      setName('');
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function loadName() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch('/api/hub/shop-profile');
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data?.error || 'Failed to load shop name');
        if (!cancelled) setName(data.shopName ?? '');
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load shop name');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadName();
    return () => {
      cancelled = true;
    };
  }, [open, mandatory]);

  function handleClose() {
    if (mandatory) return;
    setError(null);
    onClose?.();
  }

  async function handleSave() {
    const trimmed = name.trim();
    if (!trimmed) {
      setError('Please enter a shop name.');
      return;
    }

    setError(null);
    setSaving(true);
    try {
      const res = await fetch('/api/hub/shop-profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shopName: trimmed }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || 'Failed to save shop name');

      onSaved(trimmed);
      if (!mandatory) onClose?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save shop name');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title={mandatory ? 'Welcome — what should we call your shop?' : 'Shop Name'}
      description={
        mandatory
          ? 'This is the name shown in your dashboard and on your print-request page. You can change it anytime from here later.'
          : undefined
      }
      maxWidth="max-w-[420px]"
      footer={
        <>
          {!mandatory && (
            <Button type="button" variant="secondary" onClick={handleClose}>
              Cancel
            </Button>
          )}
          <Button type="button" onClick={handleSave} loading={saving} fullWidth={mandatory}>
            {saving ? 'Saving...' : mandatory ? 'Continue' : 'Save Changes'}
          </Button>
        </>
      }
    >
      {loading ? (
        <Skeleton className="h-10 w-full" />
      ) : (
        <Input
          icon={Store}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g., Crafted 3D Workshop"
          maxLength={80}
          autoFocus
        />
      )}

      {error && (
        <p className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-red-600">
          <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
          {error}
        </p>
      )}
    </Modal>
  );
}
