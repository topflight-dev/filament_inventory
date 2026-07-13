import Header from "@/components/layout/Header";

/**
 * Home ("/") — true marketing/brand landing page.
 *
 * Per Project_Log.md Phase 1 Part 2 root-cause diagnosis, the legacy
 * index.html was a dead meta-refresh to /hub, permanently overridden in
 * production by vercel.json's "/" -> "/inventory" redirect. Neither
 * mechanism is carried forward here — this is now a real, reachable
 * Home page, and /inventory, /gallery, /request, /contact, /team are
 * independent sibling routes.
 */
export default function HomePage() {
  return (
    <>
      <Header
        activePath="/"
        subtitle="A family legacy, one layer at a time."
      />
      <main className="mx-auto max-w-3xl px-6 py-16 text-center">
        <h2 className="text-2xl font-semibold text-zinc-800">
          Welcome to Crafted 3D Workshop
        </h2>
        <p className="mt-4 leading-relaxed text-zinc-600">
          From our workshop to your home — custom 3D printed goods, made with
          care by our family. Browse our live filament inventory, check out
          our gallery of finished prints, or submit a print request to get
          started.
        </p>
      </main>
    </>
  );
}
