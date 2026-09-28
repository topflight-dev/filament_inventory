'use client';

/**
 * components/hub/AuthGate.tsx — Passcode Lockscreen (server-verified session)
 * ─────────────────────────────────────────────────────────────────────────────
 * Gates the Admin Hub behind a server-verified httpOnly session cookie
 * instead of a client-side-only sessionStorage flag. On mount, asks the
 * server (/api/hub/session) whether a valid session cookie is present;
 * on submit, POSTs the shop slug + passcode to /api/hub/login, which
 * validates against the `shops` table server-side (service role, bcrypt
 * compare against passcode_hash) and — on success — sets the session
 * cookie itself. This component no longer talks to Supabase directly.
 *
 * c3dw_shop_slug / c3dw_shop_name are still written to sessionStorage on
 * successful login for other components (InventoryManager, QueueTable,
 * hub/page.tsx) that read them for display/query-scoping — but they no
 * longer control access; the server-verified cookie is the only gate.
 *
 * UPDATED 2026-09-26 (icon pass): 🔒/🔓/❌ replaced with lucide-react icons.
 *
 * UPDATED 2026-09-26 (visual redesign, phase 2): neutral light SaaS theme —
 * see HubShell.tsx's header comment. This screen renders in place of the
 * whole page (nothing sits behind it), so the old dark scrim/blur backdrop
 * is gone in favor of a plain zinc-50 canvas matching the rest of the app,
 * with a white card and a soft shadow instead of a cyan glow.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { FormEvent, useEffect, useState } from 'react';
import { AlertCircle, Loader2, Lock, LogIn } from 'lucide-react';

type AuthState = 'checking' | 'locked' | 'granted';

export default function AuthGate({ children }: { children: React.ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>('checking');
  const [shopSlugInput, setShopSlugInput] = useState('');
  const [passcodeInput, setPasscodeInput] = useState('');
  const [error, setError] = useState(false);
  const [shake, setShake] = useState(false);
  const [verifying, setVerifying] = useState(false);

  // On mount, ask the server whether a valid session cookie already exists.
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const res = await fetch('/api/hub/session');
        const data = await res.json();
        if (!cancelled) setAuthState(data?.authenticated ? 'granted' : 'locked');
      } catch (err) {
        console.warn('[C3DW Auth] Session check failed:', err);
        if (!cancelled) setAuthState('locked');
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  async function handleAuth(e: FormEvent) {
    e.preventDefault();
    const slug = shopSlugInput.trim().toLowerCase();
    const passcode = passcodeInput.trim();

    if (!slug || !passcode) {
      setError(true);
      return;
    }

    setVerifying(true);
    setError(false);

    try {
      const res = await fetch('/api/hub/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shop_slug: slug, passcode }),
      });

      if (!res.ok) {
        throw new Error('Invalid credentials');
      }

      const data = await res.json();
      sessionStorage.setItem('c3dw_shop_slug', data.shop_slug);
      if (data.shop_name) sessionStorage.setItem('c3dw_shop_name', data.shop_name);
      setAuthState('granted');
    } catch (err) {
      console.warn('[C3DW Auth] Authentication failed:', err);
      setError(true);
      setShake(true);
      setPasscodeInput('');
      setTimeout(() => setShake(false), 500);
    } finally {
      setVerifying(false);
    }
  }

  if (authState === 'checking') {
    return <div className="min-h-screen bg-zinc-50" />;
  }

  if (authState === 'granted') {
    return <>{children}</>;
  }

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-zinc-50">
      <div
        className={`w-[90%] max-w-[380px] rounded-xl border border-zinc-200 bg-white px-9 pt-11 pb-9 text-center shadow-xl ${
          shake ? 'animate-auth-shake' : ''
        }`}
      >
        <Lock className="mx-auto mb-3 h-11 w-11 text-indigo-600" strokeWidth={1.75} />
        <h2 className="mb-1.5 text-lg font-semibold tracking-wide text-zinc-900">Admin Hub Login</h2>
        <p className="mb-7 text-xs text-zinc-500">Enter your shop name and passcode to continue</p>

        <form onSubmit={handleAuth}>
          <input
            type="text"
            value={shopSlugInput}
            onChange={(e) => setShopSlugInput(e.target.value)}
            placeholder="Shop Name"
            autoComplete="off"
            spellCheck={false}
            className="mb-3.5 block w-full rounded-[10px] border border-zinc-300 bg-white px-4 py-3.5 text-center text-sm tracking-wide text-zinc-900 outline-none transition-colors placeholder:text-zinc-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30"
          />
          <input
            type="password"
            value={passcodeInput}
            onChange={(e) => setPasscodeInput(e.target.value)}
            placeholder="Passcode..."
            autoComplete="current-password"
            spellCheck={false}
            className="mb-3.5 block w-full rounded-[10px] border border-zinc-300 bg-white px-4 py-3.5 text-center text-sm tracking-wide text-zinc-900 outline-none transition-colors placeholder:text-zinc-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30"
          />
          <button
            type="submit"
            disabled={verifying}
            className="flex w-full items-center justify-center gap-2 rounded-[10px] bg-indigo-600 py-3.5 text-sm font-medium tracking-wide text-white transition-colors hover:not-disabled:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 disabled:opacity-70"
          >
            {verifying ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogIn className="h-4 w-4" />}
            {verifying ? 'Verifying...' : 'Authenticate Session'}
          </button>

          {error && (
            <p className="mt-3.5 flex items-center justify-center gap-1.5 text-xs font-semibold text-red-600">
              <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
              Invalid shop slug or passcode. Please try again.
            </p>
          )}
        </form>

        <p className="mt-6 text-xs text-zinc-400">
          Don&apos;t have a shop yet?{' '}
          <a href="/signup" className="font-medium text-indigo-600 hover:text-indigo-700">
            Sign up with an invite code
          </a>
        </p>
      </div>

      <style>{`
        @keyframes auth-shake {
          0%, 100% { transform: translateX(0); }
          15% { transform: translateX(-8px); }
          30% { transform: translateX(8px); }
          45% { transform: translateX(-6px); }
          60% { transform: translateX(6px); }
          75% { transform: translateX(-3px); }
          90% { transform: translateX(3px); }
        }
        .animate-auth-shake { animation: auth-shake 0.5s ease; }
      `}</style>
    </div>
  );
}
