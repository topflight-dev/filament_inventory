'use client';

/**
 * components/hub/ShareLinkModal.tsx — Per-Shop "Share Your Link" Modal
 * ─────────────────────────────────────────────────────────────────────────────
 * Added 2026-09-26 alongside two /request fixes (see
 * claude/notifications-redesign-plan.md in the Claude Project for the full
 * incident write-up): `/request`'s shop-slug resolution previously fell back
 * to a hardcoded slug that didn't match any real `shops` row, which silently
 * misrouted print requests into the wrong shop's dashboard whenever a link
 * was missing/wrong. That's now fixed (the fallback slug is corrected, and
 * the "guess any shop" safety net is restricted to local dev only), which
 * means a shop's `/request?shop=<slug>` link is now guaranteed to either
 * resolve to that exact shop or visibly fail — never silently land on a
 * different one.
 *
 * This modal is the customer-facing payoff of that guarantee: it hands each
 * shop owner their own exact, ready-made link to copy and share (with
 * customers, family, whoever), so nobody ever has to hand-type or remember a
 * `?shop=` slug. The link is built from THIS shop's own server-verified
 * session (GET /api/hub/session — the same session-cookie source Change
 * Passcode / Notification Settings already use), never anything
 * client-editable, so a shop owner can only ever see and share their own
 * shop's link.
 *
 * Note for later: a shop's slug (e.g. 'crafted3d') is a plain, readable
 * identifier, not a secret — this is a "hand out the right link" model, like
 * a store's own web address, not an access-token model. If a shop ever
 * wants its link to be un-guessable (not just correct-by-construction), a
 * future option is an opaque random per-shop token in place of the readable
 * slug. Not needed today — flagged here for a future feature pass.
 *
 * UPDATED 2026-09-26 (visual redesign, phase 2): neutral light SaaS theme —
 * matches ChangePasscodeModal.tsx / NotificationSettingsModal.tsx exactly.
 * See HubShell.tsx's header comment for the full reasoning.
 *
 * UPDATED 2026-09-26 (phase 3): migrated onto the shared Modal/Button kit and
 * swapped the plain "Loading…" text for a Skeleton placeholder shaped like
 * the link box it's about to reveal.
 * ─────────────────────────────────────────────────────────────────────────────
 */
import { useEffect, useState } from 'react';
import { AlertCircle, Check, Copy } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Skeleton from '@/components/ui/Skeleton';

export default function ShareLinkModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [shopName, setShopName] = useState<string | null>(null);
  const [link, setLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;

    async function loadLink() {
      setLoading(true);
      setError(null);
      setCopied(false);
      try {
        const res = await fetch('/api/hub/session');
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data?.authenticated || !data?.shop_slug) {
          throw new Error('Could not verify your shop session.');
        }
        if (!cancelled) {
          setShopName(data.shop_name ?? null);
          setLink(`${window.location.origin}/request?shop=${encodeURIComponent(data.shop_slug)}`);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Could not load your link.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadLink();
    return () => {
      cancelled = true;
    };
  }, [open]);

  function handleClose() {
    setCopied(false);
    setError(null);
    onClose();
  }

  async function handleCopy() {
    if (!link) return;
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setError('Could not copy automatically — select and copy the link manually.');
    }
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Share Your Print-Request Link"
      description={
        <>
          This link always opens {shopName ? `${shopName}'s` : "your shop's"} print request form —
          safe to send to customers, family, or anyone you want submitting jobs to your queue. It
          will never send requests to any other shop.
        </>
      }
      footer={
        <Button type="button" variant="secondary" onClick={handleClose}>
          Close
        </Button>
      }
    >
      {loading ? (
        <div className="space-y-3">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      ) : link ? (
        <>
          <div className="mb-3 block w-full break-all rounded-lg border border-zinc-200 bg-zinc-50 px-3.5 py-2.5 text-sm text-zinc-900">
            {link}
          </div>
          <Button type="button" onClick={handleCopy} icon={copied ? Check : Copy} fullWidth>
            {copied ? 'Copied!' : 'Copy Link'}
          </Button>
        </>
      ) : null}

      {error && (
        <p className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-red-600">
          <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
          {error}
        </p>
      )}
    </Modal>
  );
}
