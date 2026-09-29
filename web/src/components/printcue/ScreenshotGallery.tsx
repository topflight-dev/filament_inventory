'use client';

/**
 * components/printcue/ScreenshotGallery.tsx — Clickable Hub Screenshots
 * ─────────────────────────────────────────────────────────────────────────────
 * Added 2026-09-28, in response to Luis's question about whether the "See it
 * in action" screenshots on the printcue.ink landing page ((dashboard)/
 * welcome/page.tsx) were big enough — they render at roughly half the
 * 5xl-max-width container on desktop (~460px), noticeably smaller than the
 * images' native 800x886. This makes each screenshot a click-to-enlarge
 * button that opens a simple modal/lightbox at the image's native size —
 * genuinely bigger than the card view, not just a re-crop of the same pixels.
 *
 * Split out from page.tsx (a plain server component, so it can export real
 * metadata) into its own client component, same reasoning as
 * RequestAccessForm.tsx — only the interactive piece needs 'use client'.
 *
 * NOTE on image quality: the source screenshots are genuinely 800x886 (the
 * Browser pane's native capture size), so the lightbox intentionally does NOT
 * request a next/image width above that — doing so would just upscale and
 * blur the same pixels. If Luis ever wants crisper/bigger source images (e.g.
 * from his own higher-DPI screen), swapping the two files in public/printcue/
 * and bumping the width/height props here is all that's needed.
 * ─────────────────────────────────────────────────────────────────────────────
 */
import { useEffect, useState } from 'react';
import Image from 'next/image';
import { X, ZoomIn } from 'lucide-react';

export interface Screenshot {
  src: string;
  alt: string;
  label: string;
}

const NATIVE_WIDTH = 800;
const NATIVE_HEIGHT = 886;
const CHROME_PATH_LABEL = 'printcue.ink/hub';

function BrowserChrome() {
  return (
    <div className="flex items-center gap-2 border-b border-zinc-200 bg-zinc-50 px-4 py-2.5">
      <span className="h-2.5 w-2.5 rounded-full bg-zinc-300" />
      <span className="h-2.5 w-2.5 rounded-full bg-zinc-300" />
      <span className="h-2.5 w-2.5 rounded-full bg-zinc-300" />
      <span className="ml-2 rounded-md bg-white px-2.5 py-1 text-xs text-zinc-400">{CHROME_PATH_LABEL}</span>
    </div>
  );
}

export default function ScreenshotGallery({ screenshots }: { screenshots: Screenshot[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const active = openIndex !== null ? screenshots[openIndex] : null;

  useEffect(() => {
    if (openIndex === null) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpenIndex(null);
    }
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [openIndex]);

  return (
    <>
      <div className="grid gap-6 sm:grid-cols-2">
        {screenshots.map((shot, i) => (
          <button
            key={shot.src}
            type="button"
            onClick={() => setOpenIndex(i)}
            className="group overflow-hidden rounded-xl border border-zinc-200 bg-white text-left shadow-sm transition-shadow hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/40"
          >
            <BrowserChrome />
            <div className="relative">
              <Image
                src={shot.src}
                alt={shot.alt}
                width={NATIVE_WIDTH}
                height={NATIVE_HEIGHT}
                className="w-full"
                sizes="(min-width: 640px) 50vw, 100vw"
              />
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-zinc-900/0 transition-colors group-hover:bg-zinc-900/10">
                <span className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium text-white opacity-0 shadow-sm transition-opacity group-hover:bg-zinc-900/80 group-hover:opacity-100">
                  <ZoomIn className="h-3.5 w-3.5" />
                  Enlarge
                </span>
              </div>
            </div>
            <div className="border-t border-zinc-200 bg-white px-4 py-2.5 text-center text-xs font-medium text-zinc-500">
              {shot.label}
            </div>
          </button>
        ))}
      </div>

      {active && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={active.label}
          className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-900/80 p-4 sm:p-8"
          onClick={() => setOpenIndex(null)}
        >
          <button
            type="button"
            onClick={() => setOpenIndex(null)}
            aria-label="Close"
            className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white transition-colors hover:bg-white/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
          >
            <X className="h-5 w-5" />
          </button>
          <div
            className="max-h-full overflow-auto rounded-xl bg-white shadow-2xl"
            style={{ maxWidth: NATIVE_WIDTH }}
            onClick={(e) => e.stopPropagation()}
          >
            <BrowserChrome />
            <Image
              src={active.src}
              alt={active.alt}
              width={NATIVE_WIDTH}
              height={NATIVE_HEIGHT}
              className="w-full"
              sizes={`${NATIVE_WIDTH}px`}
              priority
            />
            <div className="border-t border-zinc-200 px-4 py-3 text-center text-sm font-medium text-zinc-600">
              {active.label}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
