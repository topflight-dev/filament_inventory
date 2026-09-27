'use client';

/**
 * components/ui/Button.tsx — Shared Button
 * ─────────────────────────────────────────────────────────────────────────────
 * Added 2026-09-26, phase 3 of the Hub/Request design pass (see
 * claude/dashboard-domain-split-plan.md in the Claude Project). Every button
 * across the Hub/Request/modals was a hand-typed Tailwind class string
 * repeated (and slowly drifting) across ~9 files. This centralizes the
 * variant/size/loading-state logic in one place so a future palette or
 * spacing tweak is a one-file change instead of a grep-and-replace.
 *
 * `icon` renders a leading lucide-react icon; passing `loading` swaps it for
 * a spinning Loader2 automatically (and disables the button) — the same
 * "icon becomes spinner while busy" pattern used everywhere already, now
 * built in instead of repeated at each call site.
 * ─────────────────────────────────────────────────────────────────────────────
 */
import { ButtonHTMLAttributes, forwardRef } from 'react';
import { Loader2, type LucideIcon } from 'lucide-react';

export type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'destructive'
  | 'destructive-solid'
  | 'success'
  | 'success-solid'
  | 'accent'
  | 'ghost'
  | 'ghost-danger';
export type ButtonSize = 'sm' | 'md';

const VARIANT_CLASS: Record<ButtonVariant, string> = {
  primary:
    'bg-indigo-600 text-white hover:not-disabled:bg-indigo-700 focus-visible:ring-indigo-500/40',
  secondary:
    'bg-white text-zinc-600 border border-zinc-300 hover:not-disabled:bg-zinc-50 focus-visible:ring-indigo-500/30',
  destructive:
    'bg-white text-red-600 border border-red-300 hover:not-disabled:bg-red-50 focus-visible:ring-red-500/30',
  'destructive-solid':
    'bg-red-600 text-white hover:not-disabled:bg-red-700 focus-visible:ring-red-500/40',
  success:
    'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:not-disabled:bg-emerald-100 focus-visible:ring-emerald-500/30',
  'success-solid':
    'bg-emerald-600 text-white hover:not-disabled:bg-emerald-700 focus-visible:ring-emerald-500/40',
  accent:
    'bg-indigo-50 text-indigo-600 border border-indigo-200 hover:not-disabled:bg-indigo-100 focus-visible:ring-indigo-500/30',
  ghost:
    'bg-white text-zinc-500 border border-zinc-200 hover:not-disabled:border-indigo-300 hover:not-disabled:bg-indigo-50 hover:not-disabled:text-indigo-600 focus-visible:ring-indigo-500/30',
  'ghost-danger':
    'bg-white text-zinc-500 border border-zinc-200 hover:not-disabled:border-red-300 hover:not-disabled:bg-red-50 hover:not-disabled:text-red-600 focus-visible:ring-red-500/30',
};

const SIZE_CLASS: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-xs gap-1.5',
  md: 'px-4.5 py-2.5 text-sm gap-2',
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: LucideIcon;
  loading?: boolean;
  fullWidth?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', size = 'md', icon: Icon, loading = false, fullWidth = false, disabled, className = '', children, ...props },
  ref
) {
  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={[
        'inline-flex items-center justify-center rounded-lg font-medium transition-colors',
        'focus:outline-none focus-visible:ring-2',
        'disabled:cursor-not-allowed disabled:!border-zinc-200 disabled:!bg-zinc-100 disabled:!text-zinc-400',
        VARIANT_CLASS[variant],
        SIZE_CLASS[size],
        fullWidth ? 'w-full' : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      {...props}
    >
      {loading ? (
        <Loader2 className="h-[1.1em] w-[1.1em] flex-shrink-0 animate-spin" />
      ) : Icon ? (
        <Icon className="h-[1.1em] w-[1.1em] flex-shrink-0" />
      ) : null}
      {children}
    </button>
  );
});

export default Button;
