/**
 * Footer — shared marketing-site footer.
 * Ported from js/utils/footer.js's `loadGlobalFooter()` injected HTML.
 * Version stamp is static here; visit tracking is handled separately
 * via src/lib/analytics/track.ts (client-side effect), not this component.
 *
 * Restyled for the "Creative Studio" warm theme: cream background (#FDFBF7)
 * matching the page body, deep charcoal (#3D3D3D) text, soft terracotta
 * (#E76F51) accent for the version stamp — replacing the legacy zinc/gray tones.
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
    <footer className="mt-12 border-t border-[#3D3D3D]/10 bg-[#FDFBF7] px-6 py-8 text-center text-sm text-[#3D3D3D]/70">
      <p>
        © {now.getFullYear()} C3DW |{' '}
        <span className="font-semibold text-[#E76F51]">v{SITE_VERSION}</span>{' '}
        | Last Updated: {dateString}
      </p>
    </footer>
  );
}
