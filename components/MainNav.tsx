'use client';

import { usePathname } from 'next/navigation';

const links = [
  { href: '/', label: 'Início', short: 'Início' },
  { href: '/clipping', label: 'Clipping', short: 'Clipping', highlight: true },
  { href: '/radar', label: 'Busca ativa', short: 'Busca' },
  { href: '/instagram', label: 'Instagram', short: 'Insta' },
  { href: '/stories', label: 'Pautas', short: 'Pautas' },
  { href: '/news', label: 'Notícias', short: 'Notícias' },
  { href: '/competitors', label: 'Concorrência', short: 'Concorrência' },
];

function isActive(pathname: string, href: string) {
  if (href === '/') return pathname === '/';
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function MainNav() {
  const pathname = usePathname();

  return (
    <nav className="-mx-4 mt-3 flex gap-2 overflow-x-auto px-4 pb-1 text-sm font-black text-zinc-700 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0 sm:pb-0" aria-label="Navegação principal">
      {links.map((link) => {
        const active = isActive(pathname, link.href);
        const activeClass = active
          ? 'bg-zinc-950 text-white shadow-sm'
          : link.highlight
            ? 'bg-emerald-100 text-emerald-950 ring-1 ring-emerald-200'
            : 'bg-zinc-200 text-zinc-800 hover:bg-zinc-300';

        return (
          <a key={link.href} className={`whitespace-nowrap rounded-full px-3 py-2 transition sm:px-4 ${activeClass}`} href={link.href}>
            <span className="sm:hidden">{link.short}</span>
            <span className="hidden sm:inline">{link.label}</span>
          </a>
        );
      })}
    </nav>
  );
}
