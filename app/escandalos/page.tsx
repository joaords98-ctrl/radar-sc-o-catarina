import { ActiveSearchClient } from '@/components/ActiveSearchClient';

export const dynamic = 'force-dynamic';

const scandalSearches = [
  'denúncia prefeitura contrato licitação Santa Catarina',
  'TCE SC irregularidade prefeitura contrato obra',
  'MPSC investigação prefeito vereador servidor Santa Catarina',
  'operação Gaeco prefeitura Câmara vereador Santa Catarina',
  'fraude licitação superfaturamento Santa Catarina',
  'improbidade administrativa Santa Catarina prefeito',
  'nepotismo câmara prefeitura Santa Catarina',
  'desvio dinheiro público Santa Catarina saúde educação obra',
  'CPI Câmara vereadores Santa Catarina irregularidade',
  'Tribunal de Contas Santa Catarina suspende licitação',
];

export default function EscandalosPage() {
  return (
    <main className="mx-auto max-w-7xl px-4 py-5 sm:px-6 sm:py-8">
      <section className="rounded-2xl bg-red-950 p-5 text-white shadow-sm sm:rounded-3xl sm:p-8">
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-red-200 sm:text-sm sm:tracking-[0.25em]">Radar de escândalos</p>
        <h2 className="mt-3 max-w-4xl text-2xl font-black leading-tight sm:text-4xl">
          Busque denúncias, investigações, contratos suspeitos e casos de dinheiro público em Santa Catarina.
        </h2>
        <p className="mt-4 max-w-4xl text-sm leading-6 text-red-100 sm:text-base">
          Esta área prioriza sinais de pauta sensíveis: TCE-SC, MPSC, Gaeco, prefeitura, câmara, licitação, contrato, obra, saúde, educação, improbidade e suspeita de irregularidade. Use como ponto de partida e sempre reapore antes de publicar.
        </p>
        <div className="mt-5 rounded-2xl bg-white/10 p-4 text-sm font-semibold leading-6 text-red-50 ring-1 ring-white/15">
          Regra editorial: trate tudo como <strong>suspeita, denúncia ou investigação</strong> até haver confirmação oficial/documental. Evite cravar culpa antes de checar fonte primária, defesa dos citados e andamento do caso.
        </div>
      </section>

      <section className="mt-6">
        <ActiveSearchClient
          initialQ="denúncia investigação contrato licitação corrupção irregularidade"
          initialTopic="Escândalos/Denúncias"
          initialHours="72"
          quickSearches={scandalSearches}
          submitLabel="Buscar escândalos"
        />
      </section>
    </main>
  );
}
