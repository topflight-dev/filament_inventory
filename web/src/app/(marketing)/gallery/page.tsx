import Image from 'next/image';
import Header from '@/components/layout/Header';

/**
 * Gallery ("/gallery") — printed products photo showcase.
 * Ported from legacy gallery.html: a static grid of finished-print photos.
 * The legacy page had no dynamic data source (no js/inventory.js logic
 * applies here) — just a hardcoded #gallery div of .gallery-item entries,
 * so this is intentionally a simple Server Component with a local array.
 * Add new entries here as more product photos become available.
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
      <main className="pb-10">
        <h2 className="mt-8 text-center text-2xl font-semibold text-zinc-800">
          Printed Products
        </h2>
        <div className="mx-auto flex max-w-5xl flex-wrap justify-center gap-6 px-6 py-8">
          {GALLERY_ITEMS.map((item) => (
            <figure
              key={item.src}
              className="w-40 text-center transition-transform hover:-translate-y-1"
            >
              <div className="overflow-hidden rounded-md border border-zinc-300 bg-white">
                <Image
                  src={item.src}
                  alt={item.alt}
                  width={150}
                  height={150}
                  className="h-auto w-full object-cover"
                />
              </div>
              <figcaption className="mt-3 text-sm font-medium text-zinc-700">
                {item.caption}
              </figcaption>
            </figure>
          ))}
        </div>
      </main>
    </>
  );
}
