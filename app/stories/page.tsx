import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import type { NewsItem } from '@/lib/types';
import { buildStoryGroups, cutoffIsoForHours, getRecentHoursFromSearchParam } from '@/lib/storyGroups';
import { StoryClusterCard } from '@/components/StoryClusterCard';
import { SortControls } from '@/components/SortControls';
import { getSortFromParam, sortLabels, sortStoryGroups } from '@/lib/sort';

export const dynamic = 'force-dynamic';

const cityFilters = ['Joinville', 'Florianópolis', 'Blumenau', 'Itajaí', 'Chapecó', 'Criciúma', 'Lages', 'Balneário Camboriú'];
const regionFilters = ['Oeste', 'Sul', 'Norte', 'Vale do Itajaí', 'Litoral Norte', 'Grande Florianópolis'];
const topicFilters = ['Trânsito/Rodovias', 'Política', 'Serviços Públicos', 'Defesa Civil', 'Economia', 'Segurança Pública'];

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

export default async function StoriesPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const hours = getRecentHoursFromSearchParam(params.hours);
  const sort = getSortFromParam(params.sort);
  const focus = typeof params.focus === 'string' ? params.focus : undefined;
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
    .limit(500);

  if (error) throw error;
  const filteredItems = ((data ?? []) as NewsItem[])
    .filter((item) => matchesLocation(item, location))
    .filter((item) => !topic || item.topic === topic);

  const groups = buildStoryGroups(filteredItems, 80);
  const sortedGroups = sortStoryGroups(groups, sort);
  const ordered = focus ? [...sortedGroups].sort((a, b) => (a.id === focus ? -1 : b.id === focus ? 1 : 0)) : sortedGroups;
  const baseParams = { hours, city, region, topic };
  const baseForSort = buildHref('/stories', baseParams);

  return (
    <main className="mx-auto max-w-7xl px-4 py-5 sm:px-6 sm:py-8">
      <section className="rounded-2xl bg-zinc-950 p-5 text-white shadow-sm sm:rounded-3xl sm:p-8">
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-zinc-400 sm:text-sm sm:tracking-[0.25em]">Radar SC v13</p>
        <h2 className="mt-3 text-2xl font-black leading-tight sm:text-4xl">Pautas agrupadas por evento.</h2>
        <p className="mt-4 max-w-4xl text-sm leading-6 text-zinc-300 sm:text-base">
          Esta é a visão técnica de agrupamento: eventos únicos, concorrência, primeiro meio e formatos. Para escolher o que publicar, use “Enviar para pauta” e acompanhe em Produção.
        </p>
      </section>

      <div className="mt-6 flex flex-col items-stretch justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h3 className="text-xl font-black sm:text-2xl">Janela de análise</h3>
          <p className="text-sm text-zinc-600">Mostrando últimas {hours}h{location ? ` em ${location}` : ''}{topic ? ` · ${topic}` : ''} · ordem: {sortLabels[sort]}.</p>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1 text-sm font-bold sm:flex-wrap sm:overflow-visible sm:pb-0">
          {[6, 12, 24, 36, 48].map((h) => (
            <a key={h} className={`whitespace-nowrap rounded-xl px-4 py-2 ${h === hours ? 'bg-zinc-950 text-white' : 'bg-zinc-200 text-zinc-800'}`} href={buildHref('/stories', { ...baseParams, hours: h, sort })}>{h}h</a>
          ))}
          <a className="whitespace-nowrap rounded-xl bg-zinc-200 px-4 py-2 text-zinc-800" href="/stories">Limpar</a>
        </div>
      </div>

      <section className="mt-5 grid gap-4 lg:grid-cols-[1fr_430px]">
        <section className="rounded-2xl border bg-white p-4 shadow-sm">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500">Cidade</p>
          <div className="mt-3 flex gap-2 overflow-x-auto pb-1 sm:flex-wrap sm:overflow-visible sm:pb-0">
            {cityFilters.map((item) => (
              <a key={item} className={`whitespace-nowrap rounded-xl px-3 py-2 text-sm font-bold ${city === item ? 'bg-zinc-950 text-white' : 'bg-zinc-100 text-zinc-800'}`} href={buildHref('/stories', { hours, city: item, topic, sort })}>{item}</a>
            ))}
          </div>
          <p className="mt-4 text-xs font-black uppercase tracking-[0.2em] text-zinc-500">Região</p>
          <div className="mt-3 flex gap-2 overflow-x-auto pb-1 sm:flex-wrap sm:overflow-visible sm:pb-0">
            {regionFilters.map((item) => (
              <a key={item} className={`whitespace-nowrap rounded-xl px-3 py-2 text-sm font-bold ${region === item ? 'bg-zinc-950 text-white' : 'bg-zinc-100 text-zinc-800'}`} href={buildHref('/stories', { hours, region: item, topic, sort })}>{item}</a>
            ))}
          </div>
          <p className="mt-4 text-xs font-black uppercase tracking-[0.2em] text-zinc-500">Tema</p>
          <div className="mt-3 flex gap-2 overflow-x-auto pb-1 sm:flex-wrap sm:overflow-visible sm:pb-0">
            {topicFilters.map((item) => (
              <a key={item} className={`whitespace-nowrap rounded-xl px-3 py-2 text-sm font-bold ${topic === item ? 'bg-zinc-950 text-white' : 'bg-zinc-100 text-zinc-800'}`} href={buildHref('/stories', { hours, city, region, topic: item, sort })}>{item}</a>
            ))}
          </div>
        </section>

        <SortControls current={sort} baseHref={baseForSort} />
      </section>

      <section className="mt-6 grid gap-4 lg:grid-cols-2">
        {ordered.map((group) => <StoryClusterCard key={group.id} group={group} />)}
        {!ordered.length ? <p className="rounded-2xl bg-white p-6 text-zinc-600">Nenhuma pauta agrupada nesse período. Rode a coleta ou amplie para 36h/48h.</p> : null}
      </section>
    </main>
  );
}
