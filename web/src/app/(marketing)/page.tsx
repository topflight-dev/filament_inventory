import Image from 'next/image';
import Link from 'next/link';
import Header from '@/components/layout/Header';

/**
 * Home ("/") — "Creative Studio" warm personal landing page.
 *
 * Redesigned away from the original storefront/robotic feel into a warm,
 * human, hobby-workshop "About Me" experience:
 *   1. Split hero — personal intro copy + soft-framed duo of family photos
 *      (luis1.jpg, ellen.jpg), replacing the old auto-crossfade slideshow.
 *   2. Our Story / Our Purpose — single narrative card, legacy copy woven
 *      together in clean prose with a sage-accented pull-quote and a simple
 *      three-item feature list.
 *   3. Inventory preview teaser — small white card inviting a peek at the
 *      live filament inventory.
 *   4. "Say Hello" CTA — centered, welcoming, links to /contact.
 *
 * Palette:
 *   background  #FDFBF7 (warm cream)
 *   cards       #FFFFFF, rounded-2xl, soft shadow
 *   terracotta  #E76F51 (primary accent / buttons)
 *   sage        #2A9D8F (secondary accent / links)
 *   text        deep charcoal (#3D3D3D) instead of pure black
 */
export default function HomePage() {
  return (
    <>
      <Header
        activePath="/"
        subtitle="A little home workshop where we design, print, and share what we make."
      />

      <div className="bg-[#FDFBF7]">
        <main className="mx-auto w-full max-w-6xl px-6 py-16">
          {/* ---------------------------------------------------------- */}
          {/* HERO — split intro + soft-framed photo duo                  */}
          {/* ---------------------------------------------------------- */}
          <section className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2">
            <div className="order-2 lg:order-1">
              <span className="inline-block rounded-full bg-[#2A9D8F]/10 px-4 py-1 text-sm font-semibold tracking-wide text-[#2A9D8F]">
                Est. 2024 · Home Workshop
              </span>
              <h2 className="mt-5 text-4xl font-bold leading-tight text-[#3D3D3D] sm:text-5xl">
                Hi, we&apos;re the Crafted&nbsp;3D&nbsp;Workshop family.
              </h2>
              <p className="mt-5 text-lg leading-relaxed text-[#3D3D3D]/80">
                What started as a Christmas Eve surprise turned our dining
                room into a family workshop. We design, tinker, and print
                together — turning curiosity into functional little pieces of
                everyday life, one layer at a time.
              </p>
              <div className="mt-8 flex flex-wrap gap-4">
                <Link
                  href="/inventory"
                  className="inline-block rounded-2xl bg-[#E76F51] px-7 py-3 font-semibold text-white shadow-[0_4px_20px_rgba(231,111,81,0.35)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#d9603f] hover:shadow-[0_8px_24px_rgba(231,111,81,0.4)]"
                >
                  Browse Live Inventory
                </Link>
                <Link
                  href="/contact"
                  className="inline-block rounded-2xl border-2 border-[#2A9D8F] px-7 py-3 font-semibold text-[#2A9D8F] transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#2A9D8F] hover:text-white"
                >
                  Say Hello
                </Link>
              </div>
            </div>

            <div className="order-1 flex justify-center lg:order-2">
              <div className="relative h-[360px] w-full max-w-[420px] sm:h-[420px]">
                <div className="absolute left-0 top-6 h-[280px] w-[220px] overflow-hidden rounded-2xl border-4 border-white shadow-[0_10px_30px_rgba(61,61,61,0.15)] sm:h-[320px] sm:w-[250px]">
                  <Image
                    src="/images/luis1.jpg"
                    alt="Luis, founder of Crafted 3D Workshop, in the workshop"
                    width={250}
                    height={320}
                    className="h-full w-full object-cover"
                    priority
                  />
                </div>
                <div className="absolute bottom-0 right-0 h-[260px] w-[200px] overflow-hidden rounded-2xl border-4 border-white shadow-[0_10px_30px_rgba(61,61,61,0.15)] sm:h-[300px] sm:w-[230px]">
                  <Image
                    src="/images/ellen.jpg"
                    alt="Ellen, operations manager of Crafted 3D Workshop"
                    width={230}
                    height={300}
                    className="h-full w-full object-cover"
                  />
                </div>
              </div>
            </div>
          </section>

          {/* ---------------------------------------------------------- */}
          {/* OUR STORY / OUR PURPOSE — narrative card                    */}
          {/* ---------------------------------------------------------- */}
          <section className="mx-auto mt-24 max-w-3xl rounded-2xl bg-white p-8 shadow-[0_4px_24px_rgba(61,61,61,0.06)] sm:p-12">
            <h2 className="text-center text-3xl font-bold text-[#3D3D3D]">
              Our Story, Our Purpose
            </h2>

            <p className="mt-6 text-lg italic leading-relaxed text-[#3D3D3D]/80">
              I&apos;m Luis — a father of four, a lifelong tinkerer, and the
              founder of Crafted 3D Workshop.
            </p>
            <p className="mt-4 leading-relaxed text-[#3D3D3D]/80">
              What began as a hobby in 2024 quickly transformed our dining
              room into a family workshop. After my wife surprised me with our
              first printer on Christmas Eve, it sparked a mission: to show my
              kids and our community the incredible possibilities of modern
              manufacturing.
            </p>
            <p className="mt-4 leading-relaxed text-[#3D3D3D]/80">
              Today, we aren&apos;t just printing parts; we are building a
              family legacy, learning entrepreneurship, and discovering
              curiosity together, one layer at a time.
            </p>

            <blockquote className="mt-6 border-l-4 border-[#2A9D8F] pl-5 text-left text-lg italic text-[#3D3D3D]/70">
              &quot;We build things together — and we learn together.&quot;
            </blockquote>

            <div className="mt-10 border-t border-[#FDFBF7] pt-8">
              <p className="leading-relaxed text-[#3D3D3D]/80">
                We specialize in functional 3D prints — objects designed to
                solve problems or add beauty to your daily life. But more
                than that, we offer a transparent, personalized experience.
              </p>

              <ul className="mt-8 grid grid-cols-1 gap-6 text-left sm:grid-cols-3">
                <li className="rounded-2xl bg-[#FDFBF7] p-5">
                  <span className="text-2xl">🔍</span>
                  <h3 className="mt-2 font-semibold text-[#3D3D3D]">
                    Live Inventory
                  </h3>
                  <p className="mt-1 text-sm leading-relaxed text-[#3D3D3D]/70">
                    A real-time list of available filaments, so you can
                    choose the exact color and finish for your project.
                  </p>
                </li>
                <li className="rounded-2xl bg-[#FDFBF7] p-5">
                  <span className="text-2xl">✨</span>
                  <h3 className="mt-2 font-semibold text-[#3D3D3D]">
                    Premium Finishes
                  </h3>
                  <p className="mt-1 text-sm leading-relaxed text-[#3D3D3D]/70">
                    Whether you need a rugged Matte part or a shiny Silk
                    gift, we help you find the right material.
                  </p>
                </li>
                <li className="rounded-2xl bg-[#FDFBF7] p-5">
                  <span className="text-2xl">🤝</span>
                  <h3 className="mt-2 font-semibold text-[#3D3D3D]">
                    Collaborative Building
                  </h3>
                  <p className="mt-1 text-sm leading-relaxed text-[#3D3D3D]/70">
                    We work directly with you to ensure your file is
                    optimized for the best possible print result.
                  </p>
                </li>
              </ul>
            </div>
          </section>

          {/* ---------------------------------------------------------- */}
          {/* INVENTORY PREVIEW TEASER                                    */}
          {/* ---------------------------------------------------------- */}
          <section className="mx-auto mt-16 flex max-w-3xl flex-col items-center justify-between gap-6 rounded-2xl bg-white p-8 text-center shadow-[0_4px_24px_rgba(61,61,61,0.06)] sm:flex-row sm:text-left">
            <div>
              <h3 className="text-xl font-bold text-[#3D3D3D]">
                Curious what&apos;s on the shelf?
              </h3>
              <p className="mt-2 text-[#3D3D3D]/70">
                Peek at our live filament inventory — updated in real time as
                spools come and go from the workshop.
              </p>
            </div>
            <Link
              href="/inventory"
              className="inline-block shrink-0 rounded-2xl bg-[#2A9D8F] px-6 py-3 font-semibold text-white transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#248c7f]"
            >
              View Inventory →
            </Link>
          </section>

          {/* ---------------------------------------------------------- */}
          {/* SAY HELLO — centered CTA                                    */}
          {/* ---------------------------------------------------------- */}
          <section className="mx-auto mt-24 max-w-2xl rounded-2xl bg-white px-8 py-14 text-center shadow-[0_4px_24px_rgba(61,61,61,0.06)]">
            <h2 className="text-3xl font-bold text-[#3D3D3D]">
              Say Hello
            </h2>
            <p className="mx-auto mt-4 max-w-md leading-relaxed text-[#3D3D3D]/70">
              Have a question, an idea for a custom print, or just want to
              talk shop? We&apos;d genuinely love to hear from you.
            </p>
            <Link
              href="/contact"
              className="mt-8 inline-block rounded-2xl bg-[#E76F51] px-9 py-4 font-semibold text-white shadow-[0_4px_20px_rgba(231,111,81,0.35)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#d9603f] hover:shadow-[0_8px_24px_rgba(231,111,81,0.4)]"
            >
              Get In Touch →
            </Link>
          </section>
        </main>
      </div>
    </>
  );
}
