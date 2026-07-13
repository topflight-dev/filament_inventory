/**
 * Footer — shared marketing-site footer.
 * Ported from js/utils/footer.js's `loadGlobalFooter()` injected HTML.
 * Version stamp is static here; visit tracking is handled separately
 * via src/lib/analytics/track.ts (client-side effect), not this component.
 */
const SITE_VERSION = '2.0.0';

export default function Footer() {
  const now = new Date();
  const dateString = now.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <footer className="mt-12 border-t border-zinc-200 px-6 py-8 text-center text-sm text-zinc-500">
      <p>
        © {now.getFullYear()} C3DW |{' '}
        <span className="text-zinc-400">v{SITE_VERSION}</span> | Last Updated:{' '}
        {dateString}
      </p>
    </footer>
  );
}
