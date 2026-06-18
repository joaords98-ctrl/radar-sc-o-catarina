import type { Metadata } from 'next';
import './globals.css';
import { ManualCollectButton } from '@/components/ManualCollectButton';

export const metadata: Metadata = {
  title: 'Radar SC — O Catarina',
  description: 'Painel editorial de notícias, concorrentes e oportunidades de pauta em Santa Catarina.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body>
        <div className="min-h-screen bg-zinc-100">
          <header className="sticky top-0 z-40 border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/85">
            <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6 sm:py-4">
              <div className="flex items-start justify-between gap-3">
                <a href="/" className="min-w-0" aria-label="Voltar ao dashboard do Radar SC">
                  <p className="truncate text-[10px] font-bold uppercase tracking-[0.22em] text-zinc-500 sm:text-xs sm:tracking-[0.25em]">O Catarina</p>
                  <h1 className="truncate text-xl font-black tracking-tight text-zinc-950 sm:text-2xl">Radar SC</h1>
                </a>
                <div className="shrink-0">
                  <ManualCollectButton variant="header" />
                </div>
              </div>

              <nav className="-mx-4 mt-3 flex gap-2 overflow-x-auto px-4 pb-1 text-sm font-semibold text-zinc-700 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0 sm:pb-0" aria-label="Navegação principal">
                <a className="whitespace-nowrap rounded-full bg-zinc-900 px-3 py-2 text-white sm:px-4" href="/">Dashboard</a>
                <a className="whitespace-nowrap rounded-full bg-zinc-200 px-3 py-2 sm:px-4" href="/stories">Pautas</a>
                <a className="whitespace-nowrap rounded-full bg-indigo-100 px-3 py-2 text-indigo-900 sm:px-4" href="/clipping">Clipping</a>
                <a className="whitespace-nowrap rounded-full bg-emerald-100 px-3 py-2 text-emerald-900 sm:px-4" href="/radar">Busca ativa</a>
                <a className="whitespace-nowrap rounded-full bg-pink-100 px-3 py-2 text-pink-900 sm:px-4" href="/instagram">Instagram</a>
                <a className="whitespace-nowrap rounded-full bg-zinc-200 px-3 py-2 sm:px-4" href="/news">Notícias</a>
                <a className="whitespace-nowrap rounded-full bg-zinc-200 px-3 py-2 sm:px-4" href="/competitors">Concorrência</a>
              </nav>
            </div>
          </header>
          {children}
        </div>
      </body>
    </html>
  );
}
