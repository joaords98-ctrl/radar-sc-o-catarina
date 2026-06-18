import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { NewsCard } from '@/components/NewsCard';
import type { NewsItem } from '@/lib/types';
import { cutoffIsoForHours, getRecentHoursFromSearchParam } from '@/lib/storyGroups';
import { SortControls } from '@/components/SortControls';
import { getSortFromParam, sortLabels, sortNewsItems } from '@/lib/sort';

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

export default async function NewsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const status = typeof params.status === 'string' ? params.status : undefined;
  const topic = typeof params.topic === 'string' ? params.topic : undefined;
  const city = typeof params.city === 'string' ? params.city : undefined;
  const region = typeof params.region === 'string' ? params.region : undefined;
  const location = city ?? region;
  const hours = getRecentHoursFromSearchParam(params.hours);
  const sort = getSortFromParam(params.sort);

  const supabase = getSupabaseAdmin();
  let query = supabase
    .from('news_items')
    .select('*')
    .gte('published_at', cutoffIsoForHours(hours))
    .neq('status', 'descartado')
    .order(sort === 'recente' ? 'published_at' : 'opportunity_score', { ascending: false })
    .order('published_at', { ascending: false })
    .limit(250);

  if (status) query = query.eq('status', status);
  if (topic) query = query.eq('topic', topic);

  const { data, error } = await query;
  if (error) throw error;
  const items = sortNewsItems(((data ?? []) as NewsItem[]).filter((item) => matchesLocation(item, location)), sort);

  const baseParams = { hours, city, region, topic, status };
  const baseForSort = buildHref('/news', baseParams);

  return (
    <main className="mx-auto max-w-7xl px-4 py-5 sm:px-6 sm:py-8">
      <div className="flex flex-col items-stretch justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500">Central v10</p>
          <h2 className="text-2xl font-black sm:text-3xl">Notícias do dia com ordenação</h2>
          <p className="mt-2 text-sm text-zinc-600">
            Últimas {hours}h{location ? ` filtradas por ${location}` : ''}. Ordem atual: {sortLabels[sort]}.
          </p>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1 text-sm font-bold sm:flex-wrap sm:overflow-visible sm:pb-0">
          {[6, 12, 24, 36, 48].map((h) => (
            <a key={h} className={`whitespace-nowrap rounded-xl px-4 py-2 ${h === hours ? 'bg-zinc-950 text-white' : 'bg-zinc-200'}`} href={buildHref('/news', { ...baseParams, hours: h, sort })}>{h}h</a>
          ))}
          <a className="whitespace-nowrap rounded-xl bg-zinc-200 px-4 py-2" href="/news">Limpar</a>
          <a className="whitespace-nowrap rounded-xl bg-zinc-200 px-4 py-2" href={buildHref('/news', { ...baseParams, status: 'novo', sort })}>Novas</a>
          <a className="whitespace-nowrap rounded-xl bg-zinc-200 px-4 py-2" href={buildHref('/news', { ...baseParams, status: 'reapurar', sort })}>Reapurar</a>
        </div>
      </div>

      <section className="mt-5 grid gap-4 lg:grid-cols-[1fr_430px]">
        <section className="rounded-2xl border bg-white p-4 shadow-sm">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500">Cidade</p>
          <div className="mt-3 flex gap-2 overflow-x-auto pb-1 sm:flex-wrap sm:overflow-visible sm:pb-0">
            {cityFilters.map((item) => (
              <a key={item} className={`whitespace-nowrap rounded-xl px-3 py-2 text-sm font-bold ${city === item ? 'bg-zinc-950 text-white' : 'bg-zinc-100 text-zinc-800'}`} href={buildHref('/news', { hours, city: item, topic, status, sort })}>{item}</a>
            ))}
          </div>
          <p className="mt-4 text-xs font-black uppercase tracking-[0.2em] text-zinc-500">Região</p>
          <div className="mt-3 flex gap-2 overflow-x-auto pb-1 sm:flex-wrap sm:overflow-visible sm:pb-0">
            {regionFilters.map((item) => (
              <a key={item} className={`whitespace-nowrap rounded-xl px-3 py-2 text-sm font-bold ${region === item ? 'bg-zinc-950 text-white' : 'bg-zinc-100 text-zinc-800'}`} href={buildHref('/news', { hours, region: item, topic, status, sort })}>{item}</a>
            ))}
          </div>
          <p className="mt-4 text-xs font-black uppercase tracking-[0.2em] text-zinc-500">Tema</p>
          <div className="mt-3 flex gap-2 overflow-x-auto pb-1 sm:flex-wrap sm:overflow-visible sm:pb-0">
            {topicFilters.map((item) => (
              <a key={item} className={`whitespace-nowrap rounded-xl px-3 py-2 text-sm font-bold ${topic === item ? 'bg-zinc-950 text-white' : 'bg-zinc-100 text-zinc-800'}`} href={buildHref('/news', { hours, city, region, topic: item, status, sort })}>{item}</a>
            ))}
          </div>
        </section>

        <SortControls current={sort} baseHref={baseForSort} />
      </section>

      <section className="mt-6 grid gap-4 lg:grid-cols-2">
        {items.map((item) => <NewsCard key={item.id} item={item} />)}
        {items.length === 0 ? <p className="rounded-2xl bg-white p-6 text-zinc-600">Nenhuma notícia encontrada com esses filtros. Rode a coleta e tente 24h, 36h ou 48h.</p> : null}
      </section>
    </main>
  );
}
