'use client';

/**
 * components/hub/AuthGate.tsx — Passcode Lockscreen (1:1 port)
 * ─────────────────────────────────────────────────────────────────────────────
 * Ported 1:1 from hub.html's #auth-overlay + handleAuth(). Since the Next.js
 * web target has no Electron `file://` branch, this always gates on the
 * "Web / Mobile path" from the legacy DOMContentLoaded logic: check
 * sessionStorage for a valid session flag; if absent, show the glassmorphism
 * lockscreen and block all children from rendering until the shop slug +
 * passcode validate against the `shops` table.
 *
 * Deliberately unchanged from legacy: sessionStorage keys
 * (c3dw_hub_auth / c3dw_shop_slug / c3dw_shop_name), the shake-on-failure
 * animation, and the exact validation query shape. Real Supabase Auth + RLS
 * is intentionally deferred to a future session per Phase 1 Part 3 Rule 2.
 * No fallback/bypass logic is added here — the admin passcode gate must
 * always validate real credentials against the `shops` table, even in local
 * dev. Only the visual palette below was updated to "Deep Oceanic Stealth".
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { validateShopCredentials } from '@/lib/supabase/hub-queries';

type AuthState = 'checking' | 'locked' | 'granted';

export default function AuthGate({ children }: { children: React.ReactNode }) {
  const supabase = useMemo(() => createClient(), []);
  const [authState, setAuthState] = useState<AuthState>('checking');
  const [shopSlugInput, setShopSlugInput] = useState('');
  const [passcodeInput, setPasscodeInput] = useState('');
  const [error, setError] = useState(false);
  const [shake, setShake] = useState(false);
  const [verifying, setVerifying] = useState(false);

  // On mount, check for an existing valid session (mirrors legacy DOMContentLoaded check)
  useEffect(() => {
    const hasSession =
      sessionStorage.getItem('c3dw_hub_auth') === 'granted' &&
      !!sessionStorage.getItem('c3dw_shop_slug');
    setAuthState(hasSession ? 'granted' : 'locked');
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
      const data = await validateShopCredentials(supabase, slug, passcode);

      if (data) {
        sessionStorage.setItem('c3dw_hub_auth', 'granted');
        sessionStorage.setItem('c3dw_shop_slug', data.shop_slug);
        if (data.shop_name) sessionStorage.setItem('c3dw_shop_name', data.shop_name);
        setAuthState('granted');
      } else {
        throw new Error('Invalid credentials');
      }
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
        <span className="mb-3 block text-[2.8rem] drop-shadow-[0_0_12px_rgba(56,189,248,0.5)]">🔒</span>
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
            className="block w-full rounded-[10px] bg-sky-500 py-3.5 text-sm font-medium tracking-wide text-slate-950 shadow-[0_4px_16px_rgba(56,189,248,0.35)] transition-colors hover:not-disabled:bg-sky-600 focus:outline-none focus:ring-2 focus:ring-sky-400 disabled:opacity-70"
          >
            {verifying ? '⏳ Verifying...' : '🔓 Authenticate Session'}
          </button>

          {error && (
            <p className="mt-3.5 text-xs font-semibold text-red-400">
              ❌ Invalid shop slug or passcode. Please try again.
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
