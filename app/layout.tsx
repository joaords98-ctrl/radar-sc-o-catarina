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
          <header className="sticky top-0 z-40 border-b bg-white/95 backdrop-blur">
            <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.25em] text-zinc-500">O Catarina</p>
                <h1 className="text-2xl font-black tracking-tight">Radar SC</h1>
              </div>
              <div className="flex flex-wrap items-center justify-end gap-3">
                <nav className="flex flex-wrap gap-3 text-sm font-semibold text-zinc-700">
                  <a className="rounded-full bg-zinc-900 px-4 py-2 text-white" href="/">Dashboard</a>
                  <a className="rounded-full bg-zinc-200 px-4 py-2" href="/stories">Pautas</a>
                  <a className="rounded-full bg-emerald-100 px-4 py-2 text-emerald-900" href="/radar">Busca ativa</a>
                  <a className="rounded-full bg-zinc-200 px-4 py-2" href="/news">Notícias</a>
                  <a className="rounded-full bg-zinc-200 px-4 py-2" href="/competitors">Concorrência</a>
                </nav>
                <ManualCollectButton variant="header" />
              </div>
            </div>
          </header>
          {children}
        </div>
      </body>
    </html>
  );
}
