import Link from 'next/link';

const NAV_LINKS = [
  { href: '/', label: 'Home' },
  { href: '/inventory', label: 'Inventory' },
  { href: '/gallery', label: 'Gallery' },
  { href: '/contact', label: 'Contact' },
  { href: '/team', label: 'Meet the Team' },
];

/**
 * Header — shared marketing-site header + nav.
 * Restyled for the "Creative Studio" warm theme:
 *   background  #FDFBF7 (warm cream) instead of the legacy blue/peach gradient
 *   title/text  deep charcoal (#3D3D3D)
 *   accent      soft terracotta (#E76F51) for the active link + subtitle
 *   secondary   sage (#2A9D8F) for hover states
 */
export default function Header({
  title = 'Crafted 3D Workshop',
  subtitle,
  activePath,
}: {
  title?: string;
  subtitle?: string;
  activePath: string;
}) {
  return (
    <header className="bg-[#FDFBF7]">
      <div className="mx-auto max-w-5xl px-6 pt-10 pb-6 text-center">
        <h1 className="text-3xl font-bold text-[#3D3D3D]">{title}</h1>
        {subtitle && (
          <p className="mt-2 text-lg italic text-[#E76F51]">{subtitle}</p>
        )}
      </div>
      <nav className="border-y border-[#3D3D3D]/10 bg-white">
        <ul className="mx-auto flex max-w-5xl flex-wrap justify-center gap-6 px-6 py-3">
          {NAV_LINKS.map((link) => {
            const isActive = activePath === link.href;
            return (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className={
                    isActive
                      ? 'border-b-2 border-[#E76F51] font-bold text-[#E76F51]'
                      : 'font-bold text-[#3D3D3D] transition-colors hover:text-[#2A9D8F]'
                  }
                >
                  {link.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </header>
  );
}
