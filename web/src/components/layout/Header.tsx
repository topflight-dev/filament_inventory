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
 * Ported from the shared <header>/<nav> markup duplicated across
 * index.html, inventory.html, gallery.html, contact.html, meettheteam.html.
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
    <header className="bg-gradient-to-b from-[#fff1eb] to-[#ace0f9]">
      <div className="mx-auto max-w-5xl px-6 pt-10 pb-6 text-center">
        <h1 className="text-3xl font-bold text-[hsl(25,36%,37%)]">{title}</h1>
        {subtitle && (
          <p className="mt-2 text-lg italic text-[hsl(0,27%,62%)]">{subtitle}</p>
        )}
      </div>
      <nav className="bg-zinc-200/70">
        <ul className="mx-auto flex max-w-5xl flex-wrap justify-center gap-6 px-6 py-3">
          {NAV_LINKS.map((link) => {
            const isActive = activePath === link.href;
            return (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className={
                    isActive
                      ? 'border-b-2 border-orange-500 font-bold text-blue-700'
                      : 'font-bold text-zinc-900 hover:underline'
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
