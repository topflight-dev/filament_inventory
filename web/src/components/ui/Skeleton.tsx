/**
 * components/ui/Skeleton.tsx — Shared loading placeholder
 * ─────────────────────────────────────────────────────────────────────────────
 * Added 2026-09-26, phase 3 of the Hub/Request design pass. Replaces plain
 * "Loading…" text and spinner-only loading states with placeholder blocks
 * shaped like the real content, which is what actually reads as a finished
 * product rather than a work-in-progress. Callers compose these into
 * row/card shapes locally (see QueueTable.tsx / InventoryManager.tsx) — this
 * component itself stays a primitive.
 * ─────────────────────────────────────────────────────────────────────────────
 */
export default function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse rounded-md bg-zinc-200/70 ${className}`} />;
}
