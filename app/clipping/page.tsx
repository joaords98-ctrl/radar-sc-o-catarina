import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import type { NewsItem } from '@/lib/types';
import { buildStoryGroups, cutoffIsoForHours, getRecentHoursFromSearchParam, type StoryGroup } from '@/lib/storyGroups';
import { getSortFromParam, sortLabels, sortStoryGroups } from '@/lib/sort';
import { SortControls } from '@/components/SortControls';
import { StatCard } from '@/components/StatCard';
import { CopyTextButton } from '@/components/CopyTextButton';
import { formatBrazilDateTime } from '@/lib/date';
import { buildClippingReport, clippingActionFor, clippingActionLabel, hasOfficialSource } from '@/lib/clipping';
import { instagramPotentialForGroup, suggestedInstagramFormatForGroup } from '@/lib/instagram';

export const dynamic = 'force-dynamic';

const cityFilters = ['Joinville', 'Florianópolis', 'Blumenau', 'Itajaí', 'Chapecó', 'Criciúma', 'Lages', 'Balneário Camboriú'];
const regionFilters = ['Oeste', 'Sul', 'Norte', 'Vale do Itajaí', 'Litoral Norte', 'Grande Florianópolis'];
const topicFilters = ['Trânsito/Rodovias', 'Política', 'Serviços Públicos', 'Defesa Civil', 'Economia', 'Segurança Pública'];
const modeLabels: Record<string, string> = {
  geral: 'Clipping geral',
  pendentes: 'Ainda não publicadas',
  oficiais: 'Com fonte oficial',
  urgentes: 'Publicar agora',
};

function normalize(input: string) {
  return input.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

function matchesLocation(item: NewsItem, location?: string) {
  if (!location) return true;
  const wanted = normalize(location);
  const haystack = normalize(`${item.city ?? ''} ${item.region ?? ''} ${item.title ?? ''} ${item.summary ?? ''}`);
  return haystack.includes(wanted);
}

function buildHref(path: string, params: Record<string, string | number | undefined>) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== '') search.set(key, String(value));
  }
  const qs = search.toString();
  return qs ? `${path}?${qs}` : path;
}

function isPublishedByOCatarina(group: StoryGroup) {
  return group.items.some((item) => item.status === 'publicado');
}

function filterGroupsByMode(groups: StoryGroup[], mode: string) {
  if (mode === 'pendentes') return groups.filter((group) => !isPublishedByOCatarina(group));
  if (mode === 'oficiais') return groups.filter(hasOfficialSource);
  if (mode === 'urgentes') return groups.filter((group) => clippingActionFor(group) === 'publicar_agora');
  return groups;
}

function RankList({ title, items }: { title: string; items: Array<{ label: string; count: number; score: number }> }) {
  return (
    <section className="rounded-2xl border bg-white p-4 shadow-sm sm:p-5">
      <h3 className="text-sm font-black uppercase tracking-[0.18em] text-zinc-500">{title}</h3>
      <div className="mt-4 space-y-3">
        {items.length ? items.slice(0, 8).map((item, index) => (
          <div key={item.label} className="flex items-center justify-between gap-3 rounded-xl bg-zinc-50 p-3 ring-1 ring-zinc-100">
            <div className="min-w-0">
              <p className="truncate text-sm font-black text-zinc-950">{index + 1}. {item.label}</p>
              <p className="text-xs text-zinc-500">Score médio {item.score}</p>
            </div>
            <span className="shrink-0 rounded-full bg-zinc-950 px-3 py-1 text-xs font-black text-white">{item.count}</span>
          </div>
        )) : <p className="text-sm text-zinc-500">Sem dados suficientes.</p>}
      </div>
    </section>
  );
}

function ClippingStoryCard({ group, index }: { group: StoryGroup; index: number }) {
  const action = clippingActionFor(group);
  const instagramPotential = instagramPotentialForGroup(group);
  const published = isPublishedByOCatarina(group);
  const official = hasOfficialSource(group);
  const firstTime = group.firstPublishedAt ? formatBrazilDateTime(group.firstPublishedAt, { dateStyle: 'short', timeStyle: 'short' }) : 'sem data';
  const latestTime = group.latestPublishedAt ? formatBrazilDateTime(group.latestPublishedAt, { dateStyle: 'short', timeStyle: 'short' }) : 'sem data';

  return (
    <article className="rounded-2xl border bg-white p-4 shadow-sm sm:p-5">
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-zinc-950 px-3 py-1 text-xs font-black text-white">#{index + 1}</span>
        <span className={`rounded-full px-3 py-1 text-xs font-black ${action === 'publicar_agora' ? 'bg-red-100 text-red-900' : action === 'apurar' ? 'bg-amber-100 text-amber-900' : action === 'monitorar' ? 'bg-blue-100 text-blue-900' : 'bg-zinc-100 text-zinc-700'}`}>{clippingActionLabel(action)}</span>
        <span className="rounded-full bg-purple-100 px-3 py-1 text-xs font-black text-purple-900">Prioridade {group.score}</span>
        <span className="rounded-full bg-pink-100 px-3 py-1 text-xs font-black text-pink-900">Insta {instagramPotential}</span>
        <span className="rounded-full bg-sky-100 px-3 py-1 text-xs font-black text-sky-900">{group.mentions} meios</span>
        {official ? <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-black text-emerald-900">Fonte oficial</span> : null}
        {published ? <span className="rounded-full bg-lime-100 px-3 py-1 text-xs font-black text-lime-900">O Catarina publicou</span> : <span className="rounded-full bg-orange-100 px-3 py-1 text-xs font-black text-orange-900">Ainda não publicado</span>}
      </div>

      <h3 className="mt-4 text-lg font-black leading-tight text-zinc-950 sm:text-xl">{group.headline}</h3>
      <p className="mt-2 text-sm text-zinc-500">{group.city ?? group.region ?? 'SC'} · {group.topic ?? 'Tema não classificado'} · {group.riskLevel === 'alto' ? 'risco alto' : group.riskLevel === 'medio' ? 'risco médio' : 'risco baixo'}</p>

      <div className="mt-4 grid gap-3 rounded-xl bg-zinc-50 p-3 text-sm ring-1 ring-zinc-100 sm:grid-cols-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-zinc-500">Primeiro</p>
          <p className="mt-1 font-semibold text-zinc-800">{group.firstSource ?? 'Não identificado'}</p>
          <p className="text-xs text-zinc-500">{firstTime}</p>
        </div>
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-zinc-500">Última atualização</p>
          <p className="mt-1 font-semibold text-zinc-800">{latestTime}</p>
        </div>
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-zinc-500">Formato</p>
          <p className="mt-1 font-semibold text-zinc-800">{suggestedInstagramFormatForGroup(group)} · {group.suggestedFormat}</p>
        </div>
        <div className="sm:col-span-3">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-zinc-500">Fontes / concorrência</p>
          <p className="mt-1 text-zinc-700">{group.sources.length ? group.sources.slice(0, 10).join(' · ') : 'Sem fontes agrupadas'}</p>
          <p className="mt-1 text-zinc-600">Concorrentes: {group.competitors.length ? group.competitors.join(', ') : 'nenhum mapeado'}</p>
        </div>
      </div>

      <div className="mt-4 rounded-xl bg-amber-50 p-3 text-sm leading-6 text-amber-950 ring-1 ring-amber-100">
        <p><strong>Ação:</strong> {group.action}</p>
        <p><strong>Ângulo:</strong> {group.angle}</p>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
        <a className="rounded-xl bg-zinc-950 px-4 py-2 text-center text-sm font-bold text-white" href={group.leadItem.link} target="_blank" rel="noreferrer">Abrir principal</a>
        <a className="rounded-xl bg-emerald-100 px-4 py-2 text-center text-sm font-bold text-emerald-900" href={`/draft?newsId=${group.leadItem.id}`}>Gerar base</a>
        <a className="rounded-xl bg-zinc-200 px-4 py-2 text-center text-sm font-bold text-zinc-800" href={`/stories?focus=${encodeURIComponent(group.id)}`}>Ver grupo</a>
        <a className="rounded-xl bg-pink-100 px-4 py-2 text-center text-sm font-bold text-pink-900" href={`/instagram?sort=instagram&city=${encodeURIComponent(group.city ?? '')}`}>Instagram</a>
      </div>
    </article>
  );
}

export default async function ClippingPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const hours = getRecentHoursFromSearchParam(params.hours);
  const sort = getSortFromParam(params.sort);
  const mode = typeof params.mode === 'string' ? params.mode : 'geral';
  const city = typeof params.city === 'string' ? params.city : undefined;
  const region = typeof params.region === 'string' ? params.region : undefined;
  const location = city ?? region;
  const topic = typeof params.topic === 'string' ? params.topic : undefined;
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from('news_items')
    .select('*')
    .gte('published_at', cutoffIsoForHours(hours))
    .neq('status', 'descartado')
    .order(sort === 'recente' ? 'published_at' : 'opportunity_score', { ascending: false })
    .order('published_at', { ascending: false })
    .limit(700);

  if (error) throw error;

  const items = ((data ?? []) as NewsItem[])
    .filter((item) => matchesLocation(item, location))
    .filter((item) => !topic || item.topic === topic);

  const groups = sortStoryGroups(buildStoryGroups(items, 120), sort);
  const visibleGroups = filterGroupsByMode(groups, mode);
  const report = buildClippingReport(groups, items, hours);
  const baseParams = { hours, city, region, topic, mode };
  const baseForSort = buildHref('/clipping', baseParams);

  return (
    <main className="mx-auto max-w-7xl px-4 py-5 sm:px-6 sm:py-8">
      <section className="rounded-2xl bg-zinc-950 p-5 text-white shadow-sm sm:rounded-3xl sm:p-8">
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-zinc-400 sm:text-sm sm:tracking-[0.25em]">Radar SC v11</p>
        <h2 className="mt-3 text-2xl font-black leading-tight sm:text-4xl">Clipping inteligente do dia.</h2>
        <p className="mt-4 max-w-4xl text-sm leading-6 text-zinc-300 sm:text-base">
          Veja o que saiu, onde saiu, quem publicou primeiro, quais pautas estão quentes e o que o O Catarina ainda não publicou.
        </p>
        <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          <CopyTextButton text={report.summaryText} label="Copiar resumo do clipping" className="rounded-xl bg-white px-4 py-3 text-sm font-black text-zinc-950 transition hover:bg-zinc-200" />
          <a className="rounded-xl bg-zinc-800 px-4 py-3 text-center text-sm font-black text-white transition hover:bg-zinc-700" href={buildHref('/api/export/clipping.csv', { hours, city, region, topic, mode, sort })}>Exportar CSV</a>
        </div>
      </section>

      <section className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <StatCard label="Notícias" value={report.totalNews} />
        <StatCard label="Pautas" value={report.totalStories} />
        <StatCard label="Urgentes" value={report.urgentCount} />
        <StatCard label="Pendentes" value={report.unpublishedCount} />
        <StatCard label="Fonte oficial" value={report.officialSourceCount} />
        <StatCard label="Janela" value={`${hours}h`} />
      </section>

      <section className="mt-5 grid gap-4 lg:grid-cols-[1fr_430px]">
        <section className="rounded-2xl border bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-4">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500">Modo do clipping</p>
              <div className="mt-3 flex gap-2 overflow-x-auto pb-1 sm:flex-wrap sm:overflow-visible sm:pb-0">
                {Object.entries(modeLabels).map(([key, label]) => (
                  <a key={key} className={`whitespace-nowrap rounded-xl px-3 py-2 text-sm font-bold ${mode === key ? 'bg-zinc-950 text-white' : 'bg-zinc-100 text-zinc-800'}`} href={buildHref('/clipping', { ...baseParams, mode: key, sort })}>{label}</a>
                ))}
              </div>
            </div>

            <div>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500">Janela</p>
              <div className="mt-3 flex gap-2 overflow-x-auto pb-1 sm:flex-wrap sm:overflow-visible sm:pb-0">
                {[6, 12, 24, 36, 48].map((h) => (
                  <a key={h} className={`whitespace-nowrap rounded-xl px-4 py-2 text-sm font-bold ${h === hours ? 'bg-zinc-950 text-white' : 'bg-zinc-100 text-zinc-800'}`} href={buildHref('/clipping', { ...baseParams, hours: h, sort })}>{h}h</a>
                ))}
                <a className="whitespace-nowrap rounded-xl bg-zinc-100 px-4 py-2 text-sm font-bold text-zinc-800" href="/clipping">Limpar</a>
              </div>
            </div>

            <div>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500">Cidade</p>
              <div className="mt-3 flex gap-2 overflow-x-auto pb-1 sm:flex-wrap sm:overflow-visible sm:pb-0">
                {cityFilters.map((item) => (
                  <a key={item} className={`whitespace-nowrap rounded-xl px-3 py-2 text-sm font-bold ${city === item ? 'bg-zinc-950 text-white' : 'bg-zinc-100 text-zinc-800'}`} href={buildHref('/clipping', { hours, city: item, topic, mode, sort })}>{item}</a>
                ))}
              </div>
            </div>

            <div>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500">Região</p>
              <div className="mt-3 flex gap-2 overflow-x-auto pb-1 sm:flex-wrap sm:overflow-visible sm:pb-0">
                {regionFilters.map((item) => (
                  <a key={item} className={`whitespace-nowrap rounded-xl px-3 py-2 text-sm font-bold ${region === item ? 'bg-zinc-950 text-white' : 'bg-zinc-100 text-zinc-800'}`} href={buildHref('/clipping', { hours, region: item, topic, mode, sort })}>{item}</a>
                ))}
              </div>
            </div>

            <div>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500">Tema</p>
              <div className="mt-3 flex gap-2 overflow-x-auto pb-1 sm:flex-wrap sm:overflow-visible sm:pb-0">
                {topicFilters.map((item) => (
                  <a key={item} className={`whitespace-nowrap rounded-xl px-3 py-2 text-sm font-bold ${topic === item ? 'bg-zinc-950 text-white' : 'bg-zinc-100 text-zinc-800'}`} href={buildHref('/clipping', { hours, city, region, topic: item, mode, sort })}>{item}</a>
                ))}
              </div>
            </div>
          </div>
        </section>

        <SortControls current={sort} baseHref={baseForSort} />
      </section>

      <section className="mt-6 grid gap-4 lg:grid-cols-3">
        <RankList title="Cidades quentes" items={report.cityRanking} />
        <RankList title="Temas do dia" items={report.topicRanking} />
        <RankList title="Fontes mais ativas" items={report.sourceRanking} />
      </section>

      <section className="mt-6 grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <section className="rounded-2xl border bg-white p-4 shadow-sm sm:p-5">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-zinc-500">Resumo copiável</p>
              <h3 className="mt-1 text-xl font-black text-zinc-950">Clipping para reunião de pauta</h3>
            </div>
            <CopyTextButton text={report.summaryText} label="Copiar tudo" />
          </div>
          <pre className="mt-4 max-h-[520px] overflow-auto whitespace-pre-wrap break-words rounded-xl bg-zinc-50 p-4 text-sm leading-6 text-zinc-800 ring-1 ring-zinc-100">{report.summaryText}</pre>
        </section>

        <section className="rounded-2xl border bg-white p-4 shadow-sm sm:p-5">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-zinc-500">Checklist editorial</p>
          <h3 className="mt-1 text-xl font-black text-zinc-950">Antes de publicar</h3>
          <div className="mt-4 space-y-3 text-sm leading-6 text-zinc-700">
            <p>1. Verificar se a pauta é realmente de Santa Catarina.</p>
            <p>2. Conferir se há fonte oficial ou release primário.</p>
            <p>3. Checar se o O Catarina já publicou para evitar repetição.</p>
            <p>4. Definir formato: site, feed, reels, story ou monitoramento.</p>
            <p>5. Em pauta com risco médio/alto, evitar acusação direta e usar linguagem cautelosa.</p>
          </div>
        </section>
      </section>

      <section className="mt-6">
        <div className="mb-4 flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-zinc-500">Mesa de clipping</p>
            <h3 className="text-2xl font-black text-zinc-950">{modeLabels[mode] ?? 'Clipping geral'} · {sortLabels[sort]}</h3>
            <p className="mt-1 text-sm text-zinc-600">{visibleGroups.length} pauta(s) agrupadas{location ? ` em ${location}` : ''}{topic ? ` · ${topic}` : ''}.</p>
          </div>
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          {visibleGroups.slice(0, 40).map((group, index) => <ClippingStoryCard key={group.id} group={group} index={index} />)}
          {!visibleGroups.length ? <p className="rounded-2xl bg-white p-6 text-zinc-600">Nenhuma pauta encontrada nesse modo. Rode a coleta, amplie a janela ou limpe os filtros.</p> : null}
        </div>
      </section>
    </main>
  );
}
