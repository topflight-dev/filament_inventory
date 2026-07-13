import Image from 'next/image';
import Header from '@/components/layout/Header';

/**
 * Gallery ("/gallery") — printed products photo showcase.
 * Ported from legacy gallery.html: a static grid of finished-print photos.
 * The legacy page had no dynamic data source (no js/inventory.js logic
 * applies here) — just a hardcoded #gallery div of .gallery-item entries,
 * so this is intentionally a simple Server Component with a local array.
 * Add new entries here as more product photos become available.
 *
 * Restyled for the "Creative Studio" warm theme: cream page background
 * (#FDFBF7), each photo presented inside a white rounded-2xl soft-shadow
 * panel (replacing the plain bordered box), charcoal caption text with a
 * terracotta hover-lift accent, matching the Home page's card language.
 */
type GalleryItem = {
  src: string;
  alt: string;
  caption: string;
};

const GALLERY_ITEMS: GalleryItem[] = [
  {
    src: '/gallery/Spool-Holder.jpg',
    alt: 'Mini Spool Holder',
    caption: 'Mini Spool Holder',
  },
];

export default function GalleryPage() {
  return (
    <>
      <Header
        activePath="/gallery"
        subtitle="Browse through the prints that I have done over the past year."
      />
      <div className="bg-[#FDFBF7]">
        <main className="pb-10">
          <h2 className="mt-8 text-center text-2xl font-semibold text-[#3D3D3D]">
            Printed Products
          </h2>
          <div className="mx-auto flex max-w-5xl flex-wrap justify-center gap-6 px-6 py-8">
            {GALLERY_ITEMS.map((item) => (
              <figure
                key={item.src}
                className="w-44 rounded-2xl bg-white p-3 text-center shadow-[0_4px_20px_rgba(61,61,61,0.08)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_8px_28px_rgba(61,61,61,0.12)]"
              >
                <div className="overflow-hidden rounded-xl border border-[#3D3D3D]/10">
                  <Image
                    src={item.src}
                    alt={item.alt}
                    width={150}
                    height={150}
                    className="h-auto w-full object-cover"
                  />
                </div>
                <figcaption className="mt-3 text-sm font-medium text-[#3D3D3D]">
                  {item.caption}
                </figcaption>
              </figure>
            ))}
          </div>
        </main>
      </div>
    </>
  );
}
