import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import type { NewsItem } from '@/lib/types';
import { cutoffIsoForHours, getRecentHoursFromSearchParam } from '@/lib/storyGroups';
import { formatBrazilDateTime } from '@/lib/date';
import { ManualCollectButton } from '@/components/ManualCollectButton';
import { SendToProductionButton } from '@/components/SendToProductionButton';

export const dynamic = 'force-dynamic';

type ScandalItem = NewsItem & {
  scandalScore: number;
  scandalReasons: string[];
};

const hourOptions = [24, 48, 72, 168];
const scandalTerms = [
  { term: 'denúncia', weight: 12, label: 'denúncia' },
  { term: 'denuncia', weight: 12, label: 'denúncia' },
  { term: 'investigação', weight: 11, label: 'investigação' },
  { term: 'investigacao', weight: 11, label: 'investigação' },
  { term: 'operação', weight: 11, label: 'operação' },
  { term: 'operacao', weight: 11, label: 'operação' },
  { term: 'gaeco', weight: 14, label: 'Gaeco' },
  { term: 'mpsc', weight: 13, label: 'MPSC' },
  { term: 'ministerio publico', weight: 12, label: 'Ministério Público' },
  { term: 'ministério público', weight: 12, label: 'Ministério Público' },
  { term: 'tce', weight: 13, label: 'TCE-SC' },
  { term: 'tribunal de contas', weight: 13, label: 'Tribunal de Contas' },
  { term: 'polícia federal', weight: 13, label: 'PF' },
  { term: 'policia federal', weight: 13, label: 'PF' },
  { term: 'fraude', weight: 13, label: 'fraude' },
  { term: 'corrupção', weight: 13, label: 'corrupção' },
  { term: 'corrupcao', weight: 13, label: 'corrupção' },
  { term: 'licitação', weight: 8, label: 'licitação' },
  { term: 'licitacao', weight: 8, label: 'licitação' },
  { term: 'superfaturamento', weight: 13, label: 'superfaturamento' },
  { term: 'improbidade', weight: 12, label: 'improbidade' },
  { term: 'nepotismo', weight: 11, label: 'nepotismo' },
  { term: 'rachadinha', weight: 12, label: 'rachadinha' },
  { term: 'desvio', weight: 10, label: 'desvio' },
  { term: 'irregularidade', weight: 9, label: 'irregularidade' },
  { term: 'contrato suspeito', weight: 11, label: 'contrato suspeito' },
  { term: 'dinheiro público', weight: 9, label: 'dinheiro público' },
  { term: 'dinheiro publico', weight: 9, label: 'dinheiro público' },
  { term: 'ação civil pública', weight: 10, label: 'ação civil pública' },
  { term: 'acao civil publica', weight: 10, label: 'ação civil pública' },
];

function normalize(input: string) {
  return input.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

function scandalSignalFor(item: NewsItem): ScandalItem | null {
  const haystack = normalize(`${item.title ?? ''} ${item.summary ?? ''} ${item.query_label ?? ''} ${item.topic ?? ''} ${item.angle ?? ''}`);
  const reasons = new Set<string>();
  let score = 0;

  for (const config of scandalTerms) {
    if (haystack.includes(normalize(config.term))) {
      score += config.weight;
      reasons.add(config.label);
    }
  }

  if (item.topic === 'Escândalos/Denúncias') {
    score += 18;
    reasons.add('classificado como escândalo');
  }

  if (item.topic === 'Dinheiro Público') {
    score += 12;
    reasons.add('dinheiro público');
  }

  if (item.topic === 'Política' && score >= 8) {
    score += 5;
    reasons.add('política');
  }

  if (score < 10) return null;

  return {
    ...item,
    scandalScore: score + Math.round((item.opportunity_score ?? 0) / 5),
    scandalReasons: Array.from(reasons).slice(0, 6),
  };
}

function urgencyClass(score: number) {
  if (score >= 45) return 'bg-red-100 text-red-950 ring-red-200';
  if (score >= 28) return 'bg-amber-100 text-amber-950 ring-amber-200';
  return 'bg-zinc-100 text-zinc-800 ring-zinc-200';
}

function buildHref(hours: number) {
  return `/escandalos?hours=${hours}`;
}

export default async function EscandalosPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const hours = getRecentHoursFromSearchParam(params.hours) || 72;
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from('news_items')
    .select('*')
    .gte('published_at', cutoffIsoForHours(hours))
    .neq('status', 'descartado')
    .order('published_at', { ascending: false })
    .limit(500);

  if (error) throw error;

  const items = ((data ?? []) as NewsItem[])
    .map(scandalSignalFor)
    .filter((item): item is ScandalItem => Boolean(item))
    .sort((a, b) => b.scandalScore - a.scandalScore || new Date(b.published_at ?? b.created_at).getTime() - new Date(a.published_at ?? a.created_at).getTime())
    .slice(0, 80);

  const urgentCount = items.filter((item) => item.scandalScore >= 45).length;
  const inProductionCount = items.filter((item) => item.status === 'em_producao' || item.status === 'publicado').length;
  const sources = Array.from(new Set(items.map((item) => item.source_name ?? item.source_domain).filter(Boolean))).slice(0, 12);

  return (
    <main className="mx-auto max-w-7xl px-4 py-5 sm:px-6 sm:py-8">
      <section className="rounded-2xl bg-red-950 p-5 text-white shadow-sm sm:rounded-3xl sm:p-8">
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-red-200 sm:text-sm sm:tracking-[0.25em]">Radar de escândalos</p>
        <h2 className="mt-3 max-w-4xl text-2xl font-black leading-tight sm:text-4xl">
          Escândalos agora entram pela coleta pesada, sem busca manual travando a Vercel.
        </h2>
        <p className="mt-4 max-w-4xl text-sm leading-6 text-red-100 sm:text-base">
          Esta tela não chama mais a rota de busca ativa. Ela lê a base já coletada pelo Radar e filtra sinais de denúncia, investigação, contrato suspeito, licitação, TCE-SC, MPSC, Gaeco e dinheiro público.
        </p>
        <div className="mt-5 rounded-2xl bg-white/10 p-4 text-sm font-semibold leading-6 text-red-50 ring-1 ring-white/15">
          Regra editorial: trate tudo como <strong>suspeita, denúncia ou investigação</strong> até haver confirmação oficial/documental. Cheque fonte primária, defesa dos citados e andamento do caso antes de publicar.
        </div>
        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-red-200">Como alimentar esta tela</p>
            <p className="mt-1 text-sm text-red-50">Use <strong>Coleta pesada</strong> ou aguarde os crons de 08h30, 11h e 16h. Eles já buscam escândalos automaticamente.</p>
          </div>
          <ManualCollectButton />
        </div>
      </section>

      <section className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-2xl border bg-white p-4 shadow-sm">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-zinc-500">Sinais</p>
          <p className="mt-2 text-3xl font-black text-zinc-950">{items.length}</p>
        </div>
        <div className="rounded-2xl border bg-white p-4 shadow-sm">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-zinc-500">Urgentes</p>
          <p className="mt-2 text-3xl font-black text-red-700">{urgentCount}</p>
        </div>
        <div className="rounded-2xl border bg-white p-4 shadow-sm">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-zinc-500">Na produção</p>
          <p className="mt-2 text-3xl font-black text-blue-700">{inProductionCount}</p>
        </div>
        <div className="rounded-2xl border bg-white p-4 shadow-sm">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-zinc-500">Janela</p>
          <p className="mt-2 text-3xl font-black text-zinc-950">{hours}h</p>
        </div>
      </section>

      <section className="mt-5 rounded-2xl border bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500">Filtro de janela</p>
            <p className="mt-1 text-sm text-zinc-600">Esta tela mostra somente o que já entrou na base do Radar.</p>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1 sm:flex-wrap sm:overflow-visible sm:pb-0">
            {hourOptions.map((option) => (
              <a key={option} className={`whitespace-nowrap rounded-xl px-4 py-2 text-sm font-black ${hours === option ? 'bg-zinc-950 text-white' : 'bg-zinc-100 text-zinc-800'}`} href={buildHref(option)}>{option}h</a>
            ))}
          </div>
        </div>
        {sources.length ? <p className="mt-4 text-sm text-zinc-600"><strong>Fontes detectadas:</strong> {sources.join(' · ')}</p> : null}
      </section>

      <section className="mt-6 grid gap-4 lg:grid-cols-2">
        {items.map((item) => (
          <article key={item.id} className="rounded-2xl border bg-white p-4 shadow-sm sm:p-5">
            <div className="flex flex-wrap gap-2">
              <span className={`rounded-full px-3 py-1 text-xs font-black ring-1 ${urgencyClass(item.scandalScore)}`}>Risco editorial {item.scandalScore}</span>
              <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-black text-zinc-800">{item.city ?? item.region ?? 'SC'}</span>
              <span className="rounded-full bg-purple-100 px-3 py-1 text-xs font-black text-purple-900">{item.topic ?? 'Escândalos'}</span>
              {item.status === 'publicado' ? <span className="rounded-full bg-lime-100 px-3 py-1 text-xs font-black text-lime-900">Publicado</span> : null}
              {item.status === 'em_producao' ? <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-black text-blue-900">Na produção</span> : null}
            </div>
            <h3 className="mt-4 text-lg font-black leading-tight text-zinc-950">{item.title}</h3>
            <p className="mt-2 text-xs font-semibold text-zinc-500">
              {item.source_name ?? item.source_domain ?? 'Fonte não identificada'} · {item.published_at ? formatBrazilDateTime(item.published_at, { dateStyle: 'short', timeStyle: 'short' }) : 'sem data'}
            </p>
            {item.summary ? <p className="mt-3 text-sm leading-6 text-zinc-600 line-clamp-3">{item.summary}</p> : null}
            <div className="mt-4 rounded-xl bg-red-50 p-3 text-sm leading-6 text-red-950 ring-1 ring-red-100">
              <p><strong>Sinais detectados:</strong> {item.scandalReasons.join(', ')}</p>
              <p><strong>Checagem obrigatória:</strong> fonte oficial, documentos, data, envolvidos, defesa dos citados e desdobramentos.</p>
            </div>
            <div className="mt-5 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
              <a href={item.link} target="_blank" rel="noreferrer" className="rounded-xl bg-zinc-950 px-4 py-2 text-center text-sm font-bold text-white">Abrir fonte</a>
              {item.status === 'em_producao' || item.status === 'publicado' ? (
                <a href="/production" className="rounded-xl bg-blue-100 px-4 py-2 text-center text-sm font-bold text-blue-950">Ver produção</a>
              ) : (
                <SendToProductionButton newsId={item.id} headline={item.title} className="rounded-xl bg-blue-500 px-4 py-2 text-center text-sm font-black text-white">Enviar para pauta</SendToProductionButton>
              )}
              <a href={`/draft?newsId=${item.id}`} className="rounded-xl bg-emerald-100 px-4 py-2 text-center text-sm font-bold text-emerald-900">Gerar base</a>
            </div>
          </article>
        ))}
        {items.length === 0 ? (
          <div className="rounded-2xl border bg-white p-6 text-zinc-600 shadow-sm lg:col-span-2">
            Nenhum sinal de escândalo encontrado nessa janela. Rode a <strong>Coleta pesada</strong> ou mude para 168h.
          </div>
        ) : null}
      </section>
    </main>
  );
}
