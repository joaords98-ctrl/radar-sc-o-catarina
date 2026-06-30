import { ManualCollectButton } from '@/components/ManualCollectButton';

export const dynamic = 'force-dynamic';

export default function RedacaoPage() {
  return (
    <main className="mx-auto max-w-5xl px-4 py-5 sm:px-6 sm:py-8">
      <section className="rounded-2xl bg-zinc-950 p-5 text-white shadow-sm sm:rounded-3xl sm:p-8">
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-zinc-400 sm:text-sm sm:tracking-[0.25em]">Redação</p>
        <h2 className="mt-3 text-2xl font-black leading-tight sm:text-4xl">Área interna do O Catarina.</h2>
        <p className="mt-4 max-w-3xl text-sm leading-6 text-zinc-300 sm:text-base">
          Aqui ficam as ações protegidas por login: coleta pesada, geração de base editorial e exportação da matéria pronta para o site.
        </p>
      </section>

      <section className="mt-5 rounded-2xl border bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-zinc-500">Atualização pesada</p>
            <h3 className="mt-2 text-xl font-black text-zinc-950">Buscar mais fontes agora</h3>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-600">
              Use quando quiser uma varredura maior. O clipping público continua com atualização rápida; a pesada fica restrita para evitar uso indevido e timeout desnecessário.
            </p>
          </div>
          <ManualCollectButton showHeavy />
        </div>
      </section>

      <section className="mt-5 grid gap-3 sm:grid-cols-2">
        <a href="/production" className="rounded-2xl border bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-zinc-500">Fila</p>
          <h3 className="mt-2 text-xl font-black text-zinc-950">Linha de produção</h3>
          <p className="mt-2 text-sm leading-6 text-zinc-600">Abra as pautas enviadas para produção e gere a base editorial a partir de cada notícia.</p>
        </a>
        <a href="/draft" className="rounded-2xl border bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-zinc-500">Texto</p>
          <h3 className="mt-2 text-xl font-black text-zinc-950">Gerar base</h3>
          <p className="mt-2 text-sm leading-6 text-zinc-600">Acesse o gerador protegido de matéria, legenda e roteiro quando uma pauta já estiver selecionada.</p>
        </a>
      </section>
    </main>
  );
}
