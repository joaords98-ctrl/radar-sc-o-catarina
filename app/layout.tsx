import type { Metadata } from 'next';
import './globals.css';
import { ManualCollectButton } from '@/components/ManualCollectButton';
import { MainNav } from '@/components/MainNav';

export const metadata: Metadata = {
  title: 'Radar SC — O Catarina',
  description: 'Painel editorial de notícias, clipping, concorrência e oportunidades de pauta em Santa Catarina.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body>
        <div className="min-h-screen bg-zinc-100">
          <header className="sticky top-0 z-40 border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/85">
            <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6 sm:py-4">
              <div className="flex items-start justify-between gap-3">
                <a href="/" className="min-w-0" aria-label="Voltar ao início do Radar SC">
                  <p className="truncate text-[10px] font-bold uppercase tracking-[0.22em] text-zinc-500 sm:text-xs sm:tracking-[0.25em]">O Catarina</p>
                  <h1 className="truncate text-xl font-black tracking-tight text-zinc-950 sm:text-2xl">Radar SC</h1>
                </a>
                <div className="shrink-0">
                  <ManualCollectButton variant="header" />
                </div>
              </div>
              <MainNav />
            </div>
          </header>
          {children}
        </div>
      </body>
    </html>
  );
}
