/**
 * components/ui/Badge.tsx — Shared status pill
 * ─────────────────────────────────────────────────────────────────────────────
 * Added 2026-09-26, phase 3 of the Hub/Request design pass. Centralizes the
 * five status tones used across the queue table, inventory stock toggle,
 * and elsewhere, so "what does amber mean here" stays answered in one place.
 * ─────────────────────────────────────────────────────────────────────────────
 */
import type { LucideIcon } from 'lucide-react';

export type BadgeTone = 'amber' | 'indigo' | 'emerald' | 'red' | 'zinc';

const TONE_CLASS: Record<BadgeTone, string> = {
  amber: 'bg-amber-50 text-amber-700 border-amber-200',
  indigo: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  red: 'bg-red-50 text-red-600 border-red-200',
  zinc: 'bg-zinc-100 text-zinc-600 border-zinc-200',
};

export default function Badge({
  tone = 'zinc',
  icon: Icon,
  className = '',
  children,
}: {
  tone?: BadgeTone;
  icon?: LucideIcon;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-4 py-1.5 text-[11px] font-semibold uppercase tracking-widest ${TONE_CLASS[tone]} ${className}`}
    >
      {Icon && <Icon className="h-3 w-3 flex-shrink-0" />}
      {children}
    </span>
  );
}
