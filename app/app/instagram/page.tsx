import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import type { NewsItem } from '@/lib/types';
import { cutoffIsoForHours, getRecentHoursFromSearchParam } from '@/lib/storyGroups';
import { InstagramOpportunityCard } from '@/components/InstagramOpportunityCard';
import { SortControls } from '@/components/SortControls';
import { getSortFromParam, sortLabels, sortNewsItems } from '@/lib/sort';
import { instagramPotentialForItem, suggestedInstagramFormatForItem } from '@/lib/instagram';

export const dynamic = 'force-dynamic';

const cityFilters = ['Joinville', 'Florianópolis', 'Blumenau', 'Itajaí', 'Chapecó', 'Criciúma', 'Lages', 'Balneário Camboriú'];
const regionFilters = ['Oeste', 'Sul', 'Norte', 'Vale do Itajaí', 'Litoral Norte', 'Grande Florianópolis'];
const topicFilters = ['Trânsito/Rodovias', 'Política', 'Serviços Públicos', 'Defesa Civil', 'Economia', 'Segurança Pública'];
const formatFilters = ['reels', 'feed', 'story', 'carrossel', 'monitorar'] as const;

const formatLabels = {
  reels: 'Reels',
  feed: 'Feed',
  story: 'Stories',
  carrossel: 'Carrossel',
  monitorar: 'Monitorar',
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

export default async function InstagramPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const hours = getRecentHoursFromSearchParam(params.hours);
  const sort = getSortFromParam(params.sort ?? 'instagram');
  const topic = typeof params.topic === 'string' ? params.topic : undefined;
  const city = typeof params.city === 'string' ? params.city : undefined;
  const region = typeof params.region === 'string' ? params.region : undefined;
  const location = city ?? region;
  const format = typeof params.format === 'string' ? params.format : undefined;

  const supabase = getSupabaseAdmin();
  let query = supabase
    .from('news_items')
    .select('*')
    .gte('published_at', cutoffIsoForHours(hours))
    .neq('status', 'descartado')
    .order('published_at', { ascending: false })
    .limit(300);

  if (topic) query = query.eq('topic', topic);

  const { data, error } = await query;
  if (error) throw error;

  const items = sortNewsItems(((data ?? []) as NewsItem[])
    .filter((item) => matchesLocation(item, location))
    .filter((item) => !format || suggestedInstagramFormatForItem(item) === format)
    .filter((item) => instagramPotentialForItem(item) >= 35), sort === 'potencial' ? 'instagram' : sort)
    .slice(0, 80);

  const reelsCount = items.filter((item) => suggestedInstagramFormatForItem(item) === 'reels').length;
  const hotCount = items.filter((item) => instagramPotentialForItem(item) >= 80).length;
  const storyCount = items.filter((item) => suggestedInstagramFormatForItem(item) === 'story').length;
  const baseParams = { hours, city, region, topic, format };
  const baseForSort = buildHref('/instagram', baseParams);

  return (
    <main className="mx-auto max-w-7xl px-4 py-5 sm:px-6 sm:py-8">
      <section className="rounded-2xl bg-zinc-950 p-5 text-white shadow-sm sm:rounded-3xl sm:p-8">
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-pink-300 sm:text-sm sm:tracking-[0.25em]">Radar SC v10 · Instagram Intelligence</p>
        <h2 className="mt-3 max-w-4xl text-2xl font-black leading-tight sm:text-4xl">O que postar agora no Instagram do O Catarina.</h2>
        <p className="mt-4 max-w-4xl text-sm leading-6 text-zinc-300 sm:text-base">
          A fila calcula potencial de Reels, Feed, Stories e Carrossel a partir de recência, vídeo/imagem, cidade, repercussão, concorrência e risco editorial. Não mede likes reais dos concorrentes; isso vem depois com importação do Meta.
        </p>
      </section>

      <section className="mt-6 grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4">
        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <p className="text-sm font-bold text-zinc-500">Oportunidades</p>
          <p className="mt-2 text-3xl font-black sm:text-4xl">{items.length}</p>
          <p className="mt-1 text-sm text-zinc-500">Últimas {hours}h</p>
        </div>
        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <p className="text-sm font-bold text-zinc-500">Publicar agora</p>
          <p className="mt-2 text-3xl font-black sm:text-4xl">{hotCount}</p>
          <p className="mt-1 text-sm text-zinc-500">Potencial acima de 80</p>
        </div>
        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <p className="text-sm font-bold text-zinc-500">Reels</p>
          <p className="mt-2 text-3xl font-black sm:text-4xl">{reelsCount}</p>
          <p className="mt-1 text-sm text-zinc-500">Pautas com apelo visual</p>
        </div>
        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <p className="text-sm font-bold text-zinc-500">Stories úteis</p>
          <p className="mt-2 text-3xl font-black sm:text-4xl">{storyCount}</p>
          <p className="mt-1 text-sm text-zinc-500">Alerta rápido/comunidade</p>
        </div>
      </section>

      <section className="mt-5 grid gap-4 lg:grid-cols-[1fr_430px]">
        <section className="rounded-2xl border bg-white p-4 shadow-sm">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500">Cidade</p>
          <div className="mt-3 flex gap-2 overflow-x-auto pb-1 sm:flex-wrap sm:overflow-visible sm:pb-0">
            {cityFilters.map((item) => (
              <a key={item} className={`whitespace-nowrap rounded-xl px-3 py-2 text-sm font-bold ${city === item ? 'bg-zinc-950 text-white' : 'bg-zinc-100 text-zinc-800'}`} href={buildHref('/instagram', { hours, city: item, topic, format, sort })}>{item}</a>
            ))}
          </div>
          <p className="mt-4 text-xs font-black uppercase tracking-[0.2em] text-zinc-500">Região</p>
          <div className="mt-3 flex gap-2 overflow-x-auto pb-1 sm:flex-wrap sm:overflow-visible sm:pb-0">
            {regionFilters.map((item) => (
              <a key={item} className={`whitespace-nowrap rounded-xl px-3 py-2 text-sm font-bold ${region === item ? 'bg-zinc-950 text-white' : 'bg-zinc-100 text-zinc-800'}`} href={buildHref('/instagram', { hours, region: item, topic, format, sort })}>{item}</a>
            ))}
          </div>
          <p className="mt-4 text-xs font-black uppercase tracking-[0.2em] text-zinc-500">Formato</p>
          <div className="mt-3 flex gap-2 overflow-x-auto pb-1 sm:flex-wrap sm:overflow-visible sm:pb-0">
            {formatFilters.map((item) => (
              <a key={item} className={`whitespace-nowrap rounded-xl px-3 py-2 text-sm font-bold ${format === item ? 'bg-pink-600 text-white' : 'bg-pink-50 text-pink-900'}`} href={buildHref('/instagram', { hours, city, region, topic, format: item, sort })}>{formatLabels[item]}</a>
            ))}
          </div>
          <p className="mt-4 text-xs font-black uppercase tracking-[0.2em] text-zinc-500">Tema</p>
          <div className="mt-3 flex gap-2 overflow-x-auto pb-1 sm:flex-wrap sm:overflow-visible sm:pb-0">
            {topicFilters.map((item) => (
              <a key={item} className={`whitespace-nowrap rounded-xl px-3 py-2 text-sm font-bold ${topic === item ? 'bg-zinc-950 text-white' : 'bg-zinc-100 text-zinc-800'}`} href={buildHref('/instagram', { hours, city, region, topic: item, format, sort })}>{item}</a>
            ))}
          </div>
        </section>

        <SortControls current={sort} baseHref={baseForSort} />
      </section>

      <div className="mt-6 flex gap-2 overflow-x-auto pb-1 text-sm font-bold sm:flex-wrap sm:overflow-visible sm:pb-0">
        {[6, 12, 24, 36, 48].map((h) => (
          <a key={h} className={`whitespace-nowrap rounded-xl px-4 py-2 ${h === hours ? 'bg-zinc-950 text-white' : 'bg-zinc-200'}`} href={buildHref('/instagram', { ...baseParams, hours: h, sort })}>{h}h</a>
        ))}
        <a className="whitespace-nowrap rounded-xl bg-zinc-200 px-4 py-2" href="/instagram">Limpar</a>
      </div>

      <section className="mt-6">
        <div className="mb-4">
          <h3 className="text-xl font-black sm:text-2xl">Fila Instagram</h3>
          <p className="text-sm text-zinc-600">Ordem atual: {sortLabels[sort === 'potencial' ? 'instagram' : sort]}.</p>
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          {items.map((item) => <InstagramOpportunityCard key={item.id} item={item} />)}
          {items.length === 0 ? <p className="rounded-2xl bg-white p-6 text-zinc-600">Nenhuma oportunidade de Instagram encontrada. Rode a coleta, use Busca ativa ou amplie a janela.</p> : null}
        </div>
      </section>
    </main>
  );
}
