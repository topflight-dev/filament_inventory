'use client';

/**
 * components/ui/Select.tsx — Shared dropdown select
 * ─────────────────────────────────────────────────────────────────────────────
 * Added 2026-09-26, phase 3 of the Hub/Request design pass. Same field
 * styling as Input.tsx/Textarea.tsx (shares fieldBaseClass), plus a trailing
 * chevron since a native <select> loses its default arrow once appearance
 * is reset for consistent cross-browser styling.
 * ─────────────────────────────────────────────────────────────────────────────
 */
import { SelectHTMLAttributes, forwardRef } from 'react';
import { ChevronDown } from 'lucide-react';
import { fieldBaseClass } from './Input';

export type SelectProps = SelectHTMLAttributes<HTMLSelectElement>;

const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { className = '', children, ...props },
  ref
) {
  return (
    <div className="relative">
      <select
        ref={ref}
        className={`${fieldBaseClass} appearance-none py-2.5 pl-3.5 pr-9 ${className}`}
        {...props}
      >
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
    </div>
  );
});

export default Select;
