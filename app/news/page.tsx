import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { NewsCard } from '@/components/NewsCard';
import type { NewsItem } from '@/lib/types';
import { cutoffIsoForHours, getRecentHoursFromSearchParam } from '@/lib/storyGroups';

export const dynamic = 'force-dynamic';

const cityFilters = ['Joinville', 'Florianópolis', 'Blumenau', 'Itajaí', 'Chapecó', 'Criciúma', 'Lages', 'Balneário Camboriú'];
const regionFilters = ['Oeste', 'Sul', 'Norte', 'Vale do Itajaí', 'Litoral Norte', 'Grande Florianópolis'];

function normalize(input: string) {
  return input.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

function matchesLocation(item: NewsItem, location?: string) {
  if (!location) return true;
  const wanted = normalize(location);
  const haystack = normalize(`${item.city ?? ''} ${item.region ?? ''} ${item.title ?? ''} ${item.summary ?? ''}`);
  return haystack.includes(wanted);
}

export default async function NewsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const status = typeof params.status === 'string' ? params.status : undefined;
  const topic = typeof params.topic === 'string' ? params.topic : undefined;
  const location = typeof params.city === 'string' ? params.city : typeof params.region === 'string' ? params.region : undefined;
  const hours = getRecentHoursFromSearchParam(params.hours);

  const supabase = getSupabaseAdmin();
  let query = supabase
    .from('news_items')
    .select('*')
    .gte('published_at', cutoffIsoForHours(hours))
    .neq('status', 'descartado')
    .order('published_at', { ascending: false })
    .order('opportunity_score', { ascending: false })
    .limit(180);

  if (status) query = query.eq('status', status);
  if (topic) query = query.eq('topic', topic);

  const { data, error } = await query;
  if (error) throw error;
  const items = ((data ?? []) as NewsItem[]).filter((item) => matchesLocation(item, location));

  const linkBase = `/news?hours=${hours}${location ? `&city=${encodeURIComponent(location)}` : ''}`;

  return (
    <main className="mx-auto max-w-7xl px-6 py-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black">Central de notícias do dia</h2>
          <p className="mt-2 text-sm text-zinc-600">
            Links das últimas {hours}h{location ? ` filtrados por ${location}` : ''}. Use os filtros para buscar notícia da cidade ou região.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 text-sm font-bold">
          {[6, 12, 24, 36].map((h) => (
            <a key={h} className={`rounded-xl px-4 py-2 ${h === hours ? 'bg-zinc-950 text-white' : 'bg-zinc-200'}`} href={`/news?hours=${h}${location ? `&city=${encodeURIComponent(location)}` : ''}`}>{h}h</a>
          ))}
          <a className="rounded-xl bg-zinc-200 px-4 py-2" href="/news">Limpar</a>
          <a className="rounded-xl bg-zinc-200 px-4 py-2" href={`${linkBase}&status=novo`}>Novas</a>
          <a className="rounded-xl bg-zinc-200 px-4 py-2" href={`${linkBase}&status=reapurar`}>Reapurar</a>
        </div>
      </div>

      <section className="mt-5 rounded-2xl border bg-white p-4 shadow-sm">
        <p className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500">Buscar por cidade</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {cityFilters.map((city) => (
            <a key={city} className={`rounded-xl px-3 py-2 text-sm font-bold ${location === city ? 'bg-zinc-950 text-white' : 'bg-zinc-100 text-zinc-800'}`} href={`/news?hours=${hours}&city=${encodeURIComponent(city)}`}>{city}</a>
          ))}
        </div>
        <p className="mt-4 text-xs font-black uppercase tracking-[0.2em] text-zinc-500">Buscar por região</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {regionFilters.map((region) => (
            <a key={region} className={`rounded-xl px-3 py-2 text-sm font-bold ${location === region ? 'bg-zinc-950 text-white' : 'bg-zinc-100 text-zinc-800'}`} href={`/news?hours=${hours}&region=${encodeURIComponent(region)}`}>{region}</a>
          ))}
        </div>
      </section>

      <section className="mt-6 grid gap-4 lg:grid-cols-2">
        {items.map((item) => <NewsCard key={item.id} item={item} />)}
        {items.length === 0 ? <p className="rounded-2xl bg-white p-6 text-zinc-600">Nenhuma notícia encontrada com esses filtros. Rode a coleta v8 e tente 24h ou 36h.</p> : null}
      </section>
    </main>
  );
}
