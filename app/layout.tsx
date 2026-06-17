import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Radar SC — O Catarina',
  description: 'Painel editorial de notícias, concorrentes e oportunidades de pauta em Santa Catarina.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body>
        <div className="min-h-screen bg-zinc-100">
          <header className="border-b bg-white">
            <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.25em] text-zinc-500">O Catarina</p>
                <h1 className="text-2xl font-black tracking-tight">Radar SC</h1>
              </div>
              <nav className="flex gap-3 text-sm font-semibold text-zinc-700">
                <a className="rounded-full bg-zinc-900 px-4 py-2 text-white" href="/">Dashboard</a>
                <a className="rounded-full bg-zinc-200 px-4 py-2" href="/news">Notícias</a>
                <a className="rounded-full bg-zinc-200 px-4 py-2" href="/competitors">Concorrência</a>
              </nav>
            </div>
          </header>
          {children}
        </div>
      </body>
    </html>
  );
}
