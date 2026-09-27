'use client';

/**
 * components/ui/Modal.tsx — Shared modal shell
 * ─────────────────────────────────────────────────────────────────────────────
 * Added 2026-09-26, phase 3 of the Hub/Request design pass. Every Hub modal
 * (ChangePasscodeModal, NotificationSettingsModal, ShareLinkModal,
 * InvEditModal) previously hand-rolled the same scrim + card + title markup
 * independently. This centralizes it, and adds the animated open/close
 * (framer-motion) that was one of the explicitly-requested phase 3 items —
 * a fade+scale on the card, a fade on the scrim, and a real exit animation
 * instead of the old instant unmount. Clicking the scrim closes the modal;
 * clicking inside the card does not (stopPropagation).
 *
 * Callers keep their own form state/handlers — this only owns the shell,
 * title/description, and the AnimatePresence mount/unmount.
 * ─────────────────────────────────────────────────────────────────────────────
 */
import type { ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

export default function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  maxWidth = 'max-w-[440px]',
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: ReactNode;
  children?: ReactNode;
  footer?: ReactNode;
  maxWidth?: string;
}) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[1000] flex items-center justify-center bg-zinc-900/40 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          onClick={onClose}
        >
          <motion.div
            className={`w-[90%] ${maxWidth} rounded-xl border border-zinc-200 bg-white p-7 text-zinc-500 shadow-xl`}
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="mb-1 text-[11px] font-semibold uppercase tracking-widest text-zinc-400">
              {title}
            </h3>
            {description && <p className="mb-4 text-xs leading-relaxed text-zinc-500">{description}</p>}
            {children}
            {footer && <div className="mt-5 flex gap-2.5">{footer}</div>}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
