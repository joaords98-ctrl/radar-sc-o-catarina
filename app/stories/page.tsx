import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import type { NewsItem } from '@/lib/types';
import { buildStoryGroups, cutoffIsoForHours, getRecentHoursFromSearchParam } from '@/lib/storyGroups';
import { StoryClusterCard } from '@/components/StoryClusterCard';

export const dynamic = 'force-dynamic';

export default async function StoriesPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const hours = getRecentHoursFromSearchParam(params.hours);
  const focus = typeof params.focus === 'string' ? params.focus : undefined;
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from('news_items')
    .select('*')
    .gte('published_at', cutoffIsoForHours(hours))
    .neq('status', 'descartado')
    .order('opportunity_score', { ascending: false })
    .order('published_at', { ascending: false })
    .limit(300);

  if (error) throw error;
  const groups = buildStoryGroups((data ?? []) as NewsItem[], 80);
  const ordered = focus ? [...groups].sort((a, b) => (a.id === focus ? -1 : b.id === focus ? 1 : 0)) : groups;

  return (
    <main className="mx-auto max-w-7xl px-6 py-8">
      <section className="rounded-3xl bg-zinc-950 p-8 text-white shadow-sm">
        <p className="text-sm font-bold uppercase tracking-[0.25em] text-zinc-400">Pautas agrupadas</p>
        <h2 className="mt-3 text-4xl font-black leading-tight">Eventos únicos, não links repetidos.</h2>
        <p className="mt-4 max-w-4xl text-zinc-300">O Radar junta matérias parecidas, calcula urgência, concorrência e formato sugerido para decidir o que publicar primeiro.</p>
      </section>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="text-2xl font-black">Janela de análise</h3>
          <p className="text-sm text-zinc-600">Mostrando últimas {hours}h. Use 6h/12h para plantão; 24h/36h para fechamento do dia.</p>
        </div>
        <div className="flex flex-wrap gap-2 text-sm font-bold">
          {[6, 12, 24, 36].map((h) => (
            <a key={h} className={`rounded-xl px-4 py-2 ${h === hours ? 'bg-zinc-950 text-white' : 'bg-zinc-200 text-zinc-800'}`} href={`/stories?hours=${h}`}>{h}h</a>
          ))}
        </div>
      </div>

      <section className="mt-6 grid gap-4 lg:grid-cols-2">
        {ordered.map((group) => <StoryClusterCard key={group.id} group={group} />)}
        {!ordered.length ? <p className="rounded-2xl bg-white p-6 text-zinc-600">Nenhuma pauta agrupada nesse período.</p> : null}
      </section>
    </main>
  );
}
