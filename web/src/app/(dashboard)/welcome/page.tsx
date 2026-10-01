/**
 * (dashboard)/welcome/page.tsx — Printcue Landing Page
 * ─────────────────────────────────────────────────────────────────────────────
 * Piece #5 of the Printcue test-release plan (see
 * claude/printcue-test-release-plan.md in the Claude Project). This is
 * Printcue's own public identity — separate from crafted3dworkshop.com —
 * built specifically to be the thing Luis links to from a Reddit comment,
 * a Facebook group reply, or a Discord message once he's actually
 * participating in those communities (see the go-to-market discussion this
 * plan doc's "piece #5" section grew out of): a page that explains what
 * Printcue is, who it's for, and ends in the request-access form, without
 * requiring an invite code to even see it.
 *
 * Lives at /welcome (a real, directly-reachable path — see middleware.ts),
 * but middleware REWRITES printcue.ink's root path ('/') here, so visitors
 * see it at the bare domain without '/welcome' ever appearing in the
 * address bar. A rewrite (not a redirect) is what keeps the URL clean.
 *
 * Visual language deliberately matches the Hub (zinc-50 canvas, white
 * cards, indigo-600 accent, lucide icons) rather than introducing a second,
 * disconnected identity — see the "match the Hub's look" decision in the
 * plan doc. The one signature flourish specific to this page is the hero
 * headline's "layer build" reveal animation (a stepped clip-path wipe,
 * bottom of the styles below) — a nod to how an FDM print actually forms:
 * bottom to top, one discrete layer at a time, not a smooth fade.
 *
 * A plain server component (no 'use client') so it can export real
 * metadata directly — everything below is static except the request-access
 * form itself, split out to components/printcue/RequestAccessForm.tsx
 * specifically so this page doesn't need to become a client component too.
 *
 * UPDATED 2026-09-28 — added a "See it in action" section with real Hub
 * screenshots (public/printcue/hub-queue.jpg, hub-inventory.jpg), replacing
 * the "illustrated/CSS-only for now" placeholder note above. These are
 * genuine screenshots of a dedicated test shop ("Riverside 3D Prints",
 * seeded with fake sample data) — NOT Luis's real crafted3d shop — so
 * nothing here ever exposes real customer names or orders.
 *
 * UPDATED 2026-09-28 (later same day) — the screenshots render noticeably
 * smaller than their native size in the two-column grid (~460px vs. the
 * source images' 800px), so per Luis's question about size, they're now
 * click-to-enlarge via components/printcue/ScreenshotGallery.tsx (a client
 * component — the browser-chrome framing, hover affordance, and the
 * lightbox modal all live there now; this file just supplies the image list).
 *
 * UPDATED 2026-09-30 — added a short animated walkthrough
 * (public/printcue/hub-demo.gif: request queue → completed archive →
 * filament inventory → back to queue), captured the same way as the two
 * static screenshots — a live Browser-pane session against the "Riverside 3D
 * Prints" test shop, never Luis's real crafted3d data. Marked `animated` in
 * HUB_SCREENSHOTS so ScreenshotGallery serves it unoptimized (see that
 * file's header comment for why) and gives it the full-width row.
 * ─────────────────────────────────────────────────────────────────────────────
 */
import type { Metadata } from 'next';
import { ArrowRight, Boxes, Inbox, Layers, LogIn, MonitorSmartphone, Ticket } from 'lucide-react';
import Card from '@/components/ui/Card';
import RequestAccessForm from '@/components/printcue/RequestAccessForm';
import ScreenshotGallery from '@/components/printcue/ScreenshotGallery';

export const metadata: Metadata = {
  title: 'Printcue — A Simple Dashboard for Small Print Shops',
  description:
    'A request queue and filament tracker for small 3D-printing shops — no print-farm complexity, just a clean way to take orders and keep track of what you have on hand. Currently invite-only.',
};

function LayerDivider() {
  return (
    <div className="px-6">
      <div
        aria-hidden
        className="mx-auto h-px max-w-5xl"
        style={{
          backgroundImage:
            'repeating-linear-gradient(to right, #d4d4d8 0, #d4d4d8 6px, transparent 6px, transparent 14px)',
        }}
      />
    </div>
  );
}

const HUB_SCREENSHOTS = [
  {
    src: '/printcue/hub-queue.jpg',
    alt: "Printcue's request queue showing three incoming print jobs with their filament and status",
    label: "Request queue — know what's next at a glance",
  },
  {
    src: '/printcue/hub-inventory.jpg',
    alt: "Printcue's filament inventory showing color swatches, materials, and stock status",
    label: 'Filament inventory — color, material, and stock in one place',
  },
  {
    src: '/printcue/hub-demo.gif',
    alt: 'A short walkthrough of the Printcue Hub: the request queue, completed archive, and filament inventory',
    label: 'See a full walkthrough of the Hub',
    animated: true,
  },
];

export default function WelcomePage() {
  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900">
      <header className="mx-auto flex max-w-5xl items-center justify-between px-6 py-6">
        <div className="flex items-center gap-2 text-sm font-semibold tracking-wide text-zinc-900">
          <Layers className="h-5 w-5 text-indigo-600" strokeWidth={2} />
          Printcue
        </div>
        <a
          href="/hub"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-zinc-500 transition-colors hover:text-indigo-600"
        >
          <LogIn className="h-4 w-4" />
          Sign In
        </a>
      </header>

      <section className="relative overflow-hidden px-6 pb-20 pt-10 sm:pb-28 sm:pt-16">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10"
          style={{
            backgroundImage: 'radial-gradient(circle, #e4e4e7 1px, transparent 1px)',
            backgroundSize: '28px 28px',
            maskImage: 'linear-gradient(to bottom, black, transparent)',
            WebkitMaskImage: 'linear-gradient(to bottom, black, transparent)',
          }}
        />
        <div className="mx-auto max-w-2xl text-center">
          <span className="mb-5 inline-flex items-center gap-1.5 rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-600">
            <Ticket className="h-3.5 w-3.5" />
            Currently invite-only
          </span>
          <h1 className="hero-headline mb-5 text-4xl font-semibold tracking-tight text-zinc-900 sm:text-5xl">
            A print shop dashboard, built in a garage.
          </h1>
          <p className="mx-auto mb-8 max-w-lg text-base leading-relaxed text-zinc-600">
            Printcue started as a way to keep my own family&apos;s print shop from drowning in texts and
            sticky notes — a simple request queue and filament tracker, nothing more. It worked well
            enough that I&apos;m opening it up to a few more shops.
          </p>
          <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
            <a
              href="#request-access"
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4.5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-indigo-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/40"
            >
              Request Access
              <ArrowRight className="h-[1.1em] w-[1.1em]" />
            </a>
            <a
              href="/hub"
              className="text-sm font-medium text-zinc-500 transition-colors hover:text-indigo-600"
            >
              Already have an invite code? Sign in
            </a>
          </div>
        </div>
      </section>

      <LayerDivider />

      <section className="mx-auto max-w-2xl px-6 py-16 text-center">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-indigo-600">
          Why I built this
        </h2>
        <p className="text-base leading-relaxed text-zinc-600">
          I run a small 3D printing shop with my family — a couple of printers, custom orders from
          neighbors and local folks, filament everywhere. Requests were coming in through texts, DMs,
          whatever was easiest — and easy to lose track of. Printcue is the tool I built to fix that for
          myself: a real request queue and a filament inventory that doesn&apos;t live in my head. It&apos;s
          not built for a print farm running a hundred printers — just for a shop like mine.
        </p>
      </section>

      <section className="mx-auto max-w-5xl px-6 py-16">
        <h2 className="mb-10 text-center text-2xl font-semibold tracking-tight text-zinc-900">
          What it does
        </h2>
        <div className="grid gap-5 sm:grid-cols-3">
          <Card>
            <Inbox className="mb-3 h-6 w-6 text-indigo-600" strokeWidth={1.75} />
            <h3 className="mb-1.5 text-sm font-semibold text-zinc-900">A real request queue</h3>
            <p className="text-sm leading-relaxed text-zinc-600">
              Customers submit requests through your own link — no more digging through texts and DMs to
              figure out what&apos;s next.
            </p>
          </Card>
          <Card>
            <Boxes className="mb-3 h-6 w-6 text-indigo-600" strokeWidth={1.75} />
            <h3 className="mb-1.5 text-sm font-semibold text-zinc-900">Filament you can actually track</h3>
            <p className="text-sm leading-relaxed text-zinc-600">
              Know what colors and materials you have on hand, without walking over to the shelf to
              check.
            </p>
          </Card>
          <Card>
            <MonitorSmartphone className="mb-3 h-6 w-6 text-indigo-600" strokeWidth={1.75} />
            <h3 className="mb-1.5 text-sm font-semibold text-zinc-900">Built for the shop floor</h3>
            <p className="text-sm leading-relaxed text-zinc-600">
              Stays signed in for weeks — leave it open on a TV or laptop by the printers and forget
              about it.
            </p>
          </Card>
        </div>
      </section>

      <LayerDivider />

      <section className="mx-auto max-w-5xl px-6 py-16">
        <div className="mb-10 text-center">
          <h2 className="mb-3 text-2xl font-semibold tracking-tight text-zinc-900">See it in action</h2>
          <p className="mx-auto max-w-lg text-sm leading-relaxed text-zinc-600">
            A real look at the dashboard — a sample shop&apos;s request queue and filament shelf, not a
            mockup.
          </p>
        </div>
        <ScreenshotGallery screenshots={HUB_SCREENSHOTS} />
      </section>

      <LayerDivider />

      <section className="mx-auto max-w-2xl px-6 py-16 text-center">
        <h2 className="mb-4 text-2xl font-semibold tracking-tight text-zinc-900">Who it&apos;s for</h2>
        <p className="text-base leading-relaxed text-zinc-600">
          Printcue is for the small, hands-on shop — one or two printers, custom orders, a side hustle or
          a family business. It&apos;s not a print-farm automation platform with cloud slicing and fleet
          orchestration; there are good tools for that already if that&apos;s what you need. This is just
          a clean way to take requests and keep track of your filament.
        </p>
      </section>

      <section id="request-access" className="mx-auto max-w-2xl px-6 py-16">
        <div className="mb-8 text-center">
          <h2 className="mb-2 text-2xl font-semibold tracking-tight text-zinc-900">Request an invite</h2>
          <p className="text-sm text-zinc-500">
            A few sentences about your shop is all I need. I read and respond to every one of these
            myself.
          </p>
        </div>
        <RequestAccessForm />
      </section>

      <footer className="border-t border-zinc-200 px-6 py-8 text-center text-xs text-zinc-400">
        Printcue ·{' '}
        <a href="/hub" className="font-medium text-zinc-500 hover:text-indigo-600">
          Sign in
        </a>
      </footer>

      <style>{`
        @keyframes layer-build {
          from { clip-path: inset(0 0 100% 0); }
          to { clip-path: inset(0 0 0% 0); }
        }
        .hero-headline {
          animation: layer-build 0.9s steps(10, end) both;
        }
      `}</style>
    </div>
  );
}
