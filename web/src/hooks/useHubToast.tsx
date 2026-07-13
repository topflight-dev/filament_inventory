'use client';

/**
 * hooks/useHubToast.tsx — Shared Toast Hook
 * ─────────────────────────────────────────────────────────────────────────────
 * Ported from hub.html's #hub-toast pattern (showToast()). Manages a single
 * toast message + auto-dismiss timer, shared across QueueTable and
 * InventoryManager. Render <HubToast /> once near the root of the Hub tree.
 *
 * Visual palette: "Studio Obsidian" dark theme — dark industrial gray toast
 * pill (#161B26, border-gray-800/60), crisp white (#F9FAFB) text.
 * ─────────────────────────────────────────────────────────────────────────────
 */
import { useCallback, useEffect, useRef, useState } from 'react';

export function useHubToast() {
  const [message, setMessage] = useState<string | null>(null);
  const [visible, setVisible] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback((msg: string) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setMessage(msg);
    setVisible(true);
    timerRef.current = setTimeout(() => setVisible(false), 2700);
  }, []);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return { message, visible, showToast };
}

export function HubToast({ message, visible }: { message: string | null; visible: boolean }) {
  return (
    <div
      className={`fixed bottom-8 left-1/2 z-[9999] min-w-[220px] -translate-x-1/2 rounded-full border border-gray-800/60 bg-[#161B26] px-6 py-3.5 text-center text-base font-semibold text-[#F9FAFB] shadow-2xl transition-all duration-300 ${
        visible ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-4 opacity-0'
      }`}
    >
      {message}
    </div>
  );
}
