'use client';

/**
 * components/ui/Textarea.tsx — Shared multi-line text field
 * ─────────────────────────────────────────────────────────────────────────────
 * Added 2026-09-26, phase 3 of the Hub/Request design pass. Same field
 * styling as Input.tsx (shares fieldBaseClass) so a textarea in a modal or
 * on the Request page never drifts from the input styling next to it.
 * ─────────────────────────────────────────────────────────────────────────────
 */
import { TextareaHTMLAttributes, forwardRef } from 'react';
import { fieldBaseClass } from './Input';

export type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement>;

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { className = '', ...props },
  ref
) {
  return <textarea ref={ref} className={`${fieldBaseClass} px-3.5 py-2.5 ${className}`} {...props} />;
});

export default Textarea;
