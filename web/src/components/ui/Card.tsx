/**
 * components/ui/Card.tsx — Shared Card/Panel
 * ─────────────────────────────────────────────────────────────────────────────
 * Added 2026-09-26, phase 3 of the Hub/Request design pass. The one visual
 * container used everywhere in the Neutral SaaS theme: white panel, zinc-200
 * border, rounded-xl, a soft shadow-sm for lift instead of a border alone.
 * ─────────────────────────────────────────────────────────────────────────────
 */
import type { HTMLAttributes } from 'react';

const PADDING_CLASS = {
  none: '',
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-7',
} as const;

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  padding?: keyof typeof PADDING_CLASS;
}

export default function Card({ padding = 'md', className = '', children, ...props }: CardProps) {
  return (
    <div
      className={`rounded-xl border border-zinc-200 bg-white shadow-sm ${PADDING_CLASS[padding]} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
