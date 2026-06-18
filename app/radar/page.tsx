import { ActiveSearchClient } from '@/components/ActiveSearchClient';

export const dynamic = 'force-dynamic';

export default function RadarAtivoPage() {
  return (
    <main className="mx-auto max-w-7xl px-6 py-8">
      <section className="rounded-3xl bg-zinc-950 p-8 text-white shadow-sm">
        <p className="text-sm font-bold uppercase tracking-[0.25em] text-zinc-400">Busca ativa</p>
        <h2 className="mt-3 max-w-4xl text-4xl font-black leading-tight">Procure a notícia da cidade, da rodovia ou do tema exato.</h2>
        <p className="mt-4 max-w-4xl text-zinc-300">
          Use quando você souber o assunto que quer encontrar. Exemplo: “vídeo caminhão tombou SC-155”. O Radar busca no Google News, filtra fora de SC, salva no banco e já libera para gerar base editorial.
        </p>
      </section>

      <section className="mt-6">
        <ActiveSearchClient />
      </section>
    </main>
  );
}
