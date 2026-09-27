'use client';

/**
 * components/ui/Input.tsx — Shared text input
 * ─────────────────────────────────────────────────────────────────────────────
 * Added 2026-09-26, phase 3 of the Hub/Request design pass. Centralizes the
 * field styling (border-zinc-300, focus:ring-indigo-500/30, disabled state)
 * that was hand-typed at every input across the Hub/Request/modals. Optional
 * leading `icon` renders a lucide-react icon inside the field, matching the
 * search-box pattern already used in InventoryManager.tsx.
 * ─────────────────────────────────────────────────────────────────────────────
 */
import { InputHTMLAttributes, forwardRef } from 'react';
import type { LucideIcon } from 'lucide-react';

export const fieldBaseClass =
  'block w-full rounded-lg border border-zinc-300 bg-white text-sm text-zinc-900 outline-none transition-colors placeholder:text-zinc-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 disabled:bg-zinc-50 disabled:text-zinc-400';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  icon?: LucideIcon;
}

const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { icon: Icon, className = '', ...props },
  ref
) {
  if (!Icon) {
    return <input ref={ref} className={`${fieldBaseClass} px-3.5 py-2.5 ${className}`} {...props} />;
  }

  return (
    <div className="relative">
      <Icon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
      <input ref={ref} className={`${fieldBaseClass} py-2.5 pl-9 pr-3.5 ${className}`} {...props} />
    </div>
  );
});

export default Input;
