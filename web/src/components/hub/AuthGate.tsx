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
 * Visual palette, shake-on-failure animation, and copy are unchanged.
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
    return <div className="min-h-screen bg-slate-950" />;
  }

  if (authState === 'granted') {
    return <>{children}</>;
  }

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/90 backdrop-blur-xl">
      <div
        className={`w-[90%] max-w-[380px] rounded-xl border border-slate-800/80 bg-slate-900/70 px-9 pt-11 pb-9 text-center shadow-[0_24px_64px_rgba(0,0,0,0.7),0_0_0_1px_rgba(56,189,248,0.15)] ${
          shake ? 'animate-auth-shake' : ''
        }`}
      >
        <Lock className="mx-auto mb-3 h-11 w-11 text-sky-400 drop-shadow-[0_0_12px_rgba(56,189,248,0.5)]" strokeWidth={1.75} />
        <h2 className="mb-1.5 text-lg font-semibold tracking-wide text-slate-200">Admin Hub Login</h2>
        <p className="mb-7 text-xs text-slate-400">Enter your shop name and passcode to continue</p>

        <form onSubmit={handleAuth}>
          <input
            type="text"
            value={shopSlugInput}
            onChange={(e) => setShopSlugInput(e.target.value)}
            placeholder="Shop Name"
            autoComplete="off"
            spellCheck={false}
            className="mb-3.5 block w-full rounded-[10px] border border-slate-800/80 bg-slate-950 px-4 py-3.5 text-center text-sm tracking-wide text-slate-200 outline-none transition-colors placeholder:text-slate-500 focus:border-sky-500 focus:ring-2 focus:ring-sky-400"
          />
          <input
            type="password"
            value={passcodeInput}
            onChange={(e) => setPasscodeInput(e.target.value)}
            placeholder="Passcode..."
            autoComplete="current-password"
            spellCheck={false}
            className="mb-3.5 block w-full rounded-[10px] border border-slate-800/80 bg-slate-950 px-4 py-3.5 text-center text-sm tracking-wide text-slate-200 outline-none transition-colors placeholder:text-slate-500 focus:border-sky-500 focus:ring-2 focus:ring-sky-400"
          />
          <button
            type="submit"
            disabled={verifying}
            className="flex w-full items-center justify-center gap-2 rounded-[10px] bg-sky-500 py-3.5 text-sm font-medium tracking-wide text-slate-950 shadow-[0_4px_16px_rgba(56,189,248,0.35)] transition-colors hover:not-disabled:bg-sky-600 focus:outline-none focus:ring-2 focus:ring-sky-400 disabled:opacity-70"
          >
            {verifying ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogIn className="h-4 w-4" />}
            {verifying ? 'Verifying...' : 'Authenticate Session'}
          </button>

          {error && (
            <p className="mt-3.5 flex items-center justify-center gap-1.5 text-xs font-semibold text-red-400">
              <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
              Invalid shop slug or passcode. Please try again.
            </p>
          )}
        </form>
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
