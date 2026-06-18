import { ActiveSearchClient } from '@/components/ActiveSearchClient';

export const dynamic = 'force-dynamic';

export default function RadarAtivoPage() {
  return (
    <main className="mx-auto max-w-7xl px-4 py-5 sm:px-6 sm:py-8">
      <section className="rounded-2xl bg-zinc-950 p-5 sm:rounded-3xl sm:p-8 text-white shadow-sm">
        <p className="text-xs font-bold uppercase tracking-[0.22em] sm:text-sm sm:tracking-[0.25em] text-zinc-400">Busca ativa</p>
        <h2 className="mt-3 max-w-4xl text-2xl font-black leading-tight sm:text-4xl">Procure a notícia da cidade, da rodovia ou do tema exato.</h2>
        <p className="mt-4 max-w-4xl text-sm leading-6 text-zinc-300 sm:text-base">
          Use quando você souber o assunto que quer encontrar. Exemplo: “vídeo caminhão tombou SC-155”. O Radar busca no Google News, filtra fora de SC, salva no banco e já libera para gerar base editorial.
        </p>
      </section>

      <section className="mt-6">
        <ActiveSearchClient />
      </section>
    </main>
  );
}
