'use client';

/**
 * Signup ("/signup") — Invite-Gated Self-Serve Sign-Up
 * ─────────────────────────────────────────────────────────────────────────────
 * Piece #1 of the Printcue test-release plan (see
 * claude/printcue-test-release-plan.md in the Claude Project). A tester
 * holding a valid invite code creates their own shop here — business name,
 * invite code, and a passcode they choose themselves (never handed to them
 * by Luis) — instead of Luis inserting a `shops` row by hand.
 *
 * Mirrors AuthGate.tsx's visual language (zinc-50 canvas, white card,
 * indigo accent, lucide icons) since this is functionally the sibling
 * screen to the Hub's login card — just for creating a shop instead of
 * signing into an existing one.
 *
 * On success, POST /api/hub/signup has already set the session cookie
 * (same as /api/hub/login) and returns the new shop's slug/name, so this
 * writes those to sessionStorage the same way AuthGate does on login, then
 * redirects straight into /hub — no separate login step, and no mandatory
 * first-login "what's your shop called?" prompt, since shop_name is
 * already set from this form.
 * ─────────────────────────────────────────────────────────────────────────────
 */
import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle, Loader2, Store, Ticket, UserPlus } from 'lucide-react';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';

export default function SignupPage() {
  const router = useRouter();

  const [shopName, setShopName] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [passcode, setPasscode] = useState('');
  const [confirmPasscode, setConfirmPasscode] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    const trimmedShopName = shopName.trim();
    const trimmedInviteCode = inviteCode.trim();

    if (!trimmedShopName || !trimmedInviteCode || !passcode) {
      setError('Please fill in every field.');
      return;
    }
    if (passcode.length < 6) {
      setError('Passcode must be at least 6 characters.');
      return;
    }
    if (passcode !== confirmPasscode) {
      setError('Passcodes do not match.');
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch('/api/hub/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shopName: trimmedShopName,
          inviteCode: trimmedInviteCode,
          passcode,
        }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(data?.error || 'Sign-up failed');
      }

      sessionStorage.setItem('c3dw_shop_slug', data.shop_slug);
      if (data.shop_name) sessionStorage.setItem('c3dw_shop_name', data.shop_name);

      router.push('/hub');
    } catch (err) {
      console.warn('[C3DW Signup] Sign-up failed:', err);
      setError(err instanceof Error ? err.message : 'Sign-up failed');
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-6 py-16">
      <div className="w-full max-w-[380px] rounded-xl border border-zinc-200 bg-white px-9 pt-11 pb-9 text-center shadow-xl">
        <Store className="mx-auto mb-3 h-11 w-11 text-indigo-600" strokeWidth={1.75} />
        <h1 className="mb-1.5 text-lg font-semibold tracking-wide text-zinc-900">Create Your Shop</h1>
        <p className="mb-7 text-xs text-zinc-500">
          You&apos;ll need an invite code to get started
        </p>

        <form onSubmit={handleSubmit} className="text-left" noValidate>
          <label htmlFor="shopName" className="mb-1.5 block text-xs font-semibold text-zinc-500">
            Business / Shop Name
          </label>
          <Input
            id="shopName"
            type="text"
            value={shopName}
            onChange={(e) => setShopName(e.target.value)}
            placeholder="e.g., Riverside 3D Prints"
            autoComplete="organization"
            className="mb-4"
          />

          <label htmlFor="inviteCode" className="mb-1.5 block text-xs font-semibold text-zinc-500">
            Invite Code
          </label>
          <Input
            id="inviteCode"
            icon={Ticket}
            type="text"
            value={inviteCode}
            onChange={(e) => setInviteCode(e.target.value)}
            placeholder="Enter your invite code"
            autoComplete="off"
            spellCheck={false}
            className="mb-4"
          />

          <label htmlFor="passcode" className="mb-1.5 block text-xs font-semibold text-zinc-500">
            Choose a Passcode
          </label>
          <Input
            id="passcode"
            type="password"
            value={passcode}
            onChange={(e) => setPasscode(e.target.value)}
            placeholder="At least 6 characters"
            autoComplete="new-password"
            spellCheck={false}
            className="mb-4"
          />

          <label htmlFor="confirmPasscode" className="mb-1.5 block text-xs font-semibold text-zinc-500">
            Confirm Passcode
          </label>
          <Input
            id="confirmPasscode"
            type="password"
            value={confirmPasscode}
            onChange={(e) => setConfirmPasscode(e.target.value)}
            placeholder="Re-enter your passcode"
            autoComplete="new-password"
            spellCheck={false}
            className="mb-5"
          />

          <Button
            type="submit"
            fullWidth
            loading={submitting}
            icon={submitting ? undefined : UserPlus}
          >
            {submitting ? 'Creating your shop...' : 'Create Shop'}
          </Button>

          {error && (
            <p className="mt-3.5 flex items-center justify-center gap-1.5 text-xs font-semibold text-red-600">
              <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
              {error}
            </p>
          )}
        </form>

        <p className="mt-6 text-xs text-zinc-400">
          Already have a shop?{' '}
          <a href="/hub" className="font-medium text-indigo-600 hover:text-indigo-700">
            Sign in instead
          </a>
        </p>
      </div>
    </div>
  );
}
