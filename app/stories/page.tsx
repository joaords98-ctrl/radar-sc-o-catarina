import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import type { NewsItem } from '@/lib/types';
import { buildStoryGroups, cutoffIsoForHours, getRecentHoursFromSearchParam } from '@/lib/storyGroups';
import { StoryClusterCard } from '@/components/StoryClusterCard';

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

export default async function StoriesPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const hours = getRecentHoursFromSearchParam(params.hours);
  const focus = typeof params.focus === 'string' ? params.focus : undefined;
  const location = typeof params.city === 'string' ? params.city : typeof params.region === 'string' ? params.region : undefined;
  const topic = typeof params.topic === 'string' ? params.topic : undefined;
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from('news_items')
    .select('*')
    .gte('published_at', cutoffIsoForHours(hours))
    .neq('status', 'descartado')
    .order('opportunity_score', { ascending: false })
    .order('published_at', { ascending: false })
    .limit(500);

  if (error) throw error;
  const filteredItems = ((data ?? []) as NewsItem[])
    .filter((item) => matchesLocation(item, location))
    .filter((item) => !topic || item.topic === topic);
  const groups = buildStoryGroups(filteredItems, 80);
  const ordered = focus ? [...groups].sort((a, b) => (a.id === focus ? -1 : b.id === focus ? 1 : 0)) : groups;
  const base = `/stories?hours=${hours}`;

  return (
    <main className="mx-auto max-w-7xl px-6 py-8">
      <section className="rounded-3xl bg-zinc-950 p-8 text-white shadow-sm">
        <p className="text-sm font-bold uppercase tracking-[0.25em] text-zinc-400">Pautas agrupadas</p>
        <h2 className="mt-3 text-4xl font-black leading-tight">Notícias por cidade, sem puxar coisa de fora de SC.</h2>
        <p className="mt-4 max-w-4xl text-zinc-300">
          A v8 filtra contexto catarinense, separa por cidade/região e reduz a dominância de segurança pública.
        </p>
      </section>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="text-2xl font-black">Janela de análise</h3>
          <p className="text-sm text-zinc-600">Mostrando últimas {hours}h{location ? ` em ${location}` : ''}{topic ? ` · ${topic}` : ''}.</p>
        </div>
        <div className="flex flex-wrap gap-2 text-sm font-bold">
          {[6, 12, 24, 36].map((h) => (
            <a key={h} className={`rounded-xl px-4 py-2 ${h === hours ? 'bg-zinc-950 text-white' : 'bg-zinc-200 text-zinc-800'}`} href={`/stories?hours=${h}${location ? `&city=${encodeURIComponent(location)}` : ''}${topic ? `&topic=${encodeURIComponent(topic)}` : ''}`}>{h}h</a>
          ))}
          <a className="rounded-xl bg-zinc-200 px-4 py-2 text-zinc-800" href="/stories">Limpar</a>
        </div>
      </div>

      <section className="mt-5 rounded-2xl border bg-white p-4 shadow-sm">
        <p className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500">Cidade</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {cityFilters.map((city) => (
            <a key={city} className={`rounded-xl px-3 py-2 text-sm font-bold ${location === city ? 'bg-zinc-950 text-white' : 'bg-zinc-100 text-zinc-800'}`} href={`${base}&city=${encodeURIComponent(city)}${topic ? `&topic=${encodeURIComponent(topic)}` : ''}`}>{city}</a>
          ))}
        </div>
        <p className="mt-4 text-xs font-black uppercase tracking-[0.2em] text-zinc-500">Região</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {regionFilters.map((region) => (
            <a key={region} className={`rounded-xl px-3 py-2 text-sm font-bold ${location === region ? 'bg-zinc-950 text-white' : 'bg-zinc-100 text-zinc-800'}`} href={`${base}&region=${encodeURIComponent(region)}${topic ? `&topic=${encodeURIComponent(topic)}` : ''}`}>{region}</a>
          ))}
        </div>
        <p className="mt-4 text-xs font-black uppercase tracking-[0.2em] text-zinc-500">Tema</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {topicFilters.map((item) => (
            <a key={item} className={`rounded-xl px-3 py-2 text-sm font-bold ${topic === item ? 'bg-zinc-950 text-white' : 'bg-zinc-100 text-zinc-800'}`} href={`${base}${location ? `&city=${encodeURIComponent(location)}` : ''}&topic=${encodeURIComponent(item)}`}>{item}</a>
          ))}
        </div>
      </section>

      <section className="mt-6 grid gap-4 lg:grid-cols-2">
        {ordered.map((group) => <StoryClusterCard key={group.id} group={group} />)}
        {!ordered.length ? <p className="rounded-2xl bg-white p-6 text-zinc-600">Nenhuma pauta agrupada nesse período. Rode a coleta v8 ou amplie para 36h.</p> : null}
      </section>
    </main>
  );
}
