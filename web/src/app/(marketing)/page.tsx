import Image from 'next/image';
import Link from 'next/link';
import Header from '@/components/layout/Header';

/**
 * Home ("/") — true marketing/brand landing page.
 *
 * Per Project_Log.md Phase 1 root-cause diagnosis, the legacy index.html was
 * a dead meta-refresh to /hub, permanently overridden in production by the
 * old vercel.json's "/" -> "/inventory" redirect. Neither mechanism is
 * carried forward here.
 *
 * This is a full Tailwind port of the ORIGINAL legacy homepage content
 * (recovered from git history, commit e6b49c4 — pre-meta-refresh version):
 *   - Hero image-slideshow section w/ "Our Story" text-box overlay
 *   - "Our Purpose" two-column (image + feature list) section
 *   - Bottom CTA section linking to /inventory
 * All original copy is preserved verbatim; only the slideshow's CSS
 * keyframe-animation and markup were reimplemented with Tailwind utility
 * classes + a small inline <style> for the crossfade keyframes (arbitrary
 * animations aren't expressible as pure utility classes).
 */
export default function HomePage() {
  return (
    <>
      <Header
        activePath="/"
        subtitle="Welcome to the Family Workshop. A Family-Run 3D Printing Studio!"
      />

      <div className="flex min-h-screen">
        <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-10">
          {/* ---------------------------------------------------------- */}
          {/* HERO — image slideshow with "Our Story" overlay text-box    */}
          {/* ---------------------------------------------------------- */}
          <section className="relative mb-10 h-[500px] w-full overflow-hidden rounded-2xl">
            <div className="absolute inset-0">
              <div
                className="slide absolute inset-0 bg-cover bg-center opacity-0"
                style={{
                  backgroundImage: "url('/images/luis1.jpg')",
                  animationDelay: '0s',
                }}
              />
              <div
                className="slide absolute inset-0 bg-cover bg-center opacity-0"
                style={{
                  backgroundImage: "url('/images/ellen.jpg')",
                  animationDelay: '5s',
                }}
              />
              <div
                className="slide absolute inset-0 bg-cover bg-center opacity-0"
                style={{
                  backgroundImage: "url('/images/jordiluis1.jpg')",
                  animationDelay: '10s',
                }}
              />
            </div>

            <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/20 px-6">
              <div className="max-h-[80%] max-w-[85%] overflow-y-auto rounded-xl bg-white/90 p-8 text-center shadow-2xl backdrop-blur-sm">
                <h2 className="text-2xl font-semibold text-zinc-900">Our Story</h2>
                <p className="mt-3 text-lg italic text-zinc-700">
                  I&apos;m Luis — a father of four, a lifelong tinkerer, and the
                  founder of Crafted 3D Workshop.
                </p>
                <p className="mt-4 leading-relaxed text-zinc-700">
                  What began as a hobby in 2024 quickly transformed our dining
                  room into a family workshop. After my wife surprised me with
                  our first printer on Christmas Eve, it sparked a mission: to
                  show my kids and our community the incredible possibilities
                  of modern manufacturing.
                </p>
                <p className="mt-4 leading-relaxed text-zinc-700">
                  Today, we aren&apos;t just printing parts; we are building a
                  family legacy, learning entrepreneurship, and discovering
                  curiosity together, one layer at a time.
                </p>
                <p className="mt-4 border-l-4 border-zinc-300 pl-4 text-left italic text-zinc-600">
                  &quot;We build things together - and we learn together.&quot;
                </p>
              </div>
            </div>
          </section>

          {/* ---------------------------------------------------------- */}
          {/* OUR PURPOSE — two-column (image + feature list), reversed   */}
          {/* ---------------------------------------------------------- */}
          <section className="mb-16 flex flex-col-reverse items-center gap-8 lg:flex-row-reverse">
            <div className="flex flex-1 justify-center">
              <Image
                src="/images/placeholder.jpg"
                alt="Custom 3D printing services"
                width={350}
                height={250}
                className="h-[250px] w-full max-w-[350px] rounded-lg object-cover shadow-md"
              />
            </div>
            <div className="flex-1 text-center lg:text-left">
              <h2 className="text-2xl font-semibold text-zinc-900">Our Purpose</h2>
              <p className="mt-3 leading-relaxed text-zinc-700">
                We specialize in functional 3D prints—objects designed to solve
                problems or add beauty to your daily life. But more than that,
                we offer a transparent, personalized experience.
              </p>

              <ul className="mt-5 list-none space-y-4 p-0 text-left">
                <li>
                  <strong>🔍 Explore Our Live Inventory:</strong> We maintain a
                  real-time list of available filaments, so you can choose the
                  exact color and finish for your project.
                </li>
                <li>
                  <strong>✨ Premium Finishes:</strong> Whether you need a
                  rugged Matte part or a shiny Silk gift, we help you find the
                  right material.
                </li>
                <li>
                  <strong>🤝 Collaborative Building:</strong> We work directly
                  with you to ensure your file is optimized for the best
                  possible print result.
                </li>
              </ul>
            </div>
          </section>

          {/* ---------------------------------------------------------- */}
          {/* CTA — link to live inventory                                */}
          {/* ---------------------------------------------------------- */}
          <section className="py-12 text-center">
            <h2 className="text-2xl font-semibold text-zinc-900">
              Ready to see what&apos;s in stock?
            </h2>
            <p className="mt-3 text-zinc-600">
              Browse our current selection of colors and finishes to start
              your next project.
            </p>
            <Link
              href="/inventory"
              className="cta-button mt-6 inline-block rounded-lg bg-green-600 px-8 py-4 font-bold text-white transition-transform hover:-translate-y-0.5 hover:bg-green-700"
            >
              View Color Inventory →
            </Link>
          </section>
        </main>
      </div>

      {/* Crossfade keyframes for the hero slideshow — matches legacy
          styles/style.css's `.slide` / `@keyframes fadeSlider` timing
          (15s loop, 3 slides staggered 5s apart via animationDelay above). */}
      <style>{`
        .slide {
          animation: fadeSlider 15s infinite;
        }
        @keyframes fadeSlider {
          0% { opacity: 0; }
          10% { opacity: 1; }
          33% { opacity: 1; }
          43% { opacity: 0; }
          100% { opacity: 0; }
        }
      `}</style>
    </>
  );
}
