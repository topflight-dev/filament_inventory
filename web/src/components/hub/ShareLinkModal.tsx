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
 * Visual palette matches ChangePasscodeModal.tsx / NotificationSettingsModal.tsx
 * exactly — "Deep Oceanic Stealth" theme.
 * ─────────────────────────────────────────────────────────────────────────────
 */
import { useEffect, useState } from 'react';
import { AlertCircle, Check, Copy } from 'lucide-react';

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

  if (!open) return null;

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
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/70">
      <div className="w-[90%] max-w-[440px] rounded-xl border border-slate-800/80 bg-slate-900/70 p-7 text-slate-400 shadow-2xl">
        <h3 className="mb-1 text-[11px] font-semibold uppercase tracking-widest text-slate-500">
          Share Your Print-Request Link
        </h3>
        <p className="mb-4 text-xs leading-relaxed text-slate-500">
          This link always opens {shopName ? `${shopName}'s` : "your shop's"} print request form —
          safe to send to customers, family, or anyone you want submitting jobs to your queue. It
          will never send requests to any other shop.
        </p>

        {loading ? (
          <p className="py-6 text-center text-xs italic text-slate-500">Loading…</p>
        ) : link ? (
          <>
            <div className="mb-3 block w-full break-all rounded-lg border border-slate-800/80 bg-slate-950 px-3.5 py-2.5 text-sm text-slate-200">
              {link}
            </div>
            <button
              type="button"
              onClick={handleCopy}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-sky-500 px-4.5 py-2.5 text-sm font-medium text-slate-950 transition-colors hover:bg-sky-600 focus:outline-none focus:ring-2 focus:ring-sky-400"
            >
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copied ? 'Copied!' : 'Copy Link'}
            </button>
          </>
        ) : null}

        {error && (
          <p className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-red-400">
            <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
            {error}
          </p>
        )}

        <div className="mt-5 flex gap-2.5">
          <button
            type="button"
            onClick={handleClose}
            className="rounded-lg border border-slate-800/80 bg-slate-950 px-4.5 py-2.5 text-sm font-medium text-slate-400 transition-colors hover:bg-slate-800/40"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
