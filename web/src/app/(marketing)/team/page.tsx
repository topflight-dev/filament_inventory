import Image from 'next/image';
import Header from '@/components/layout/Header';

/**
 * Meet the Team ("/team") — family bio grid.
 * Ported from legacy meettheteam.html: an intro paragraph followed by
 * a responsive grid of team-member cards (avatar + role + bio).
 *
 * Restyled for the "Creative Studio" warm theme: cream page background
 * (#FDFBF7), each bio presented inside a white rounded-2xl soft-shadow
 * panel (replacing the plain bordered card), terracotta avatar ring
 * accent, charcoal typography throughout — matching the Home page's
 * card language. Copy and data are entirely unchanged.
 */
type TeamMember = {
  src: string;
  alt: string;
  role: string;
  bio: string;
};

const TEAM_MEMBERS: TeamMember[] = [
  {
    src: '/images/luis1.jpg',
    alt: 'Dad Avatar',
    role: 'The Founder & Lead Maker (Dad)',
    bio: 'The one who received the fateful gift in 2024. I handle the technical side of the shop—from 3D modeling and slicer settings to keeping the printers running smoothly. My favorite part of the job is watching a digital file become a physical object and teaching my kids that if they can imagine it, we can print it.',
  },
  {
    src: '/images/ellen.jpg',
    alt: 'Mom Avatar',
    role: 'The Operations Manager (Mom)',
    bio: "The glue that holds the workshop together. She ensures our workflow stays organized, manages the \"big picture\" of the business, and makes sure the team stays fueled and focused. She's the expert at turning our hobbyist energy into a professional experience for our customers.",
  },
  {
    src: '/images/evan1.jpg',
    alt: 'Evan Avatar',
    role: 'Chief Quality Officer (Evan)',
    bio: 'As the eldest, he has the keenest eye for detail. He is responsible for inspecting finished prints, removing support structures, and ensuring that every item meets our "family-standard" before it heads to the shipping station. If it isn\'t perfect, it doesn\'t leave the shop.',
  },
  {
    src: '/images/enrique3.jpg',
    alt: 'Enrique Avatar',
    role: 'Head of Logistics & Inventory (Enrique)',
    bio: "He keeps the gears turning by managing our filament stock and packaging. He's learning the \"ins and outs\" of shipping, calculating costs, and making sure we have the supplies we need to fulfill every order on time. He's the reason your package arrives safely and organized.",
  },
  {
    src: '/images/ailey.jpg',
    alt: 'Ailey Avatar',
    role: 'Director of Creative Design & Finishing (Ailey)',
    bio: "Our resident color expert and creative consultant. She helps select the best filament colors for new projects and assists with the post-processing and aesthetics of our prints. She ensures that everything we make doesn't just work well—it looks great, too!",
  },
  {
    src: '/images/jordiluis1.jpg',
    alt: 'Jordi-Luis Avatar',
    role: 'The Chief Inspiration Officer (Jordi-Luis)',
    bio: 'The youngest member of the crew! While he\'s mostly in charge of napping and moral support, he\'s the reason we started this journey. He reminds us every day why we are building this family legacy and keeps the "vibe" in the workshop light and happy.',
  },
];

export default function TeamPage() {
  return (
    <>
      <Header
        activePath="/team"
        subtitle="A family legacy, one layer at a time."
      />
      <div className="bg-[#FDFBF7]">
        <main className="pb-16">
          <section className="mx-auto max-w-3xl rounded-2xl bg-white px-6 pt-10 pb-8 text-center shadow-[0_4px_24px_rgba(61,61,61,0.06)] mt-10 sm:px-12">
            <h2 className="text-2xl font-semibold text-[#3D3D3D]">
              Behind the Prints: A Family Affair
            </h2>
            <p className="mt-4 leading-relaxed text-[#3D3D3D]/70">
              While the machines do the heavy lifting, the heart of our
              business is found in the everyday chaos and joy of our family
              life. Our workshop isn&apos;t just a place for manufacturing;
              it&apos;s a space where we gather to solve problems, spark
              creativity, and learn the value of a job well done. From the
              dining room table to the printer bench, we&apos;ve turned our
              2024 hobby into a hands-on lesson in entrepreneurship for our
              children. Every project we take on is a team effort, fueled by
              curiosity, a little bit of &quot;middle-school&quot; logic, and
              the goal of building something meaningful together. We
              aren&apos;t just shipping out plastic and resin—we&apos;re
              sharing a piece of our family&apos;s journey with you.
            </p>
          </section>

          <section className="mx-auto grid max-w-5xl grid-cols-1 gap-8 px-6 py-10 sm:grid-cols-2 lg:grid-cols-3">
            {TEAM_MEMBERS.map((member) => (
              <div
                key={member.src}
                className="flex flex-col items-center rounded-2xl bg-white p-6 text-center shadow-[0_4px_20px_rgba(61,61,61,0.08)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_8px_28px_rgba(61,61,61,0.12)]"
              >
                <div className="h-28 w-28 overflow-hidden rounded-full border-4 border-[#E76F51]/30">
                  <Image
                    src={member.src}
                    alt={member.alt}
                    width={112}
                    height={112}
                    className="h-full w-full object-cover"
                  />
                </div>
                <h3 className="mt-4 text-lg font-semibold text-[#3D3D3D]">
                  {member.role}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-[#3D3D3D]/70">
                  {member.bio}
                </p>
              </div>
            ))}
          </section>
        </main>
      </div>
    </>
  );
}
