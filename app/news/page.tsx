import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { NewsCard } from '@/components/NewsCard';
import type { NewsItem } from '@/lib/types';
import { cutoffIsoForHours, getRecentHoursFromSearchParam } from '@/lib/storyGroups';

export const dynamic = 'force-dynamic';

export default async function NewsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const status = typeof params.status === 'string' ? params.status : undefined;
  const topic = typeof params.topic === 'string' ? params.topic : undefined;
  const city = typeof params.city === 'string' ? params.city : undefined;
  const hours = getRecentHoursFromSearchParam(params.hours);

  const supabase = getSupabaseAdmin();
  let query = supabase.from('news_items').select('*').gte('published_at', cutoffIsoForHours(hours)).order('published_at', { ascending: false }).order('opportunity_score', { ascending: false }).limit(100);

  if (status) query = query.eq('status', status);
  if (topic) query = query.eq('topic', topic);
  if (city) query = query.eq('city', city);

  const { data, error } = await query;
  if (error) throw error;
  const items = (data ?? []) as NewsItem[];

  const linkBase = `/news?hours=${hours}`;

  return (
    <main className="mx-auto max-w-7xl px-6 py-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black">Central de notícias do dia</h2>
          <p className="mt-2 text-sm text-zinc-600">Links individuais das últimas {hours}h. Para decisão editorial, use também a aba Pautas.</p>
        </div>
        <div className="flex flex-wrap gap-2 text-sm font-bold">
          {[6, 12, 24, 36].map((h) => (
            <a key={h} className={`rounded-xl px-4 py-2 ${h === hours ? 'bg-zinc-950 text-white' : 'bg-zinc-200'}`} href={`/news?hours=${h}`}>{h}h</a>
          ))}
          <a className="rounded-xl bg-zinc-200 px-4 py-2" href={linkBase}>Todas</a>
          <a className="rounded-xl bg-zinc-200 px-4 py-2" href={`${linkBase}&status=novo`}>Novas</a>
          <a className="rounded-xl bg-zinc-200 px-4 py-2" href={`${linkBase}&status=reapurar`}>Reapurar</a>
          <a className="rounded-xl bg-zinc-200 px-4 py-2" href={`${linkBase}&status=publicado`}>Publicadas</a>
        </div>
      </div>

      <section className="mt-6 grid gap-4 lg:grid-cols-2">
        {items.map((item) => <NewsCard key={item.id} item={item} />)}
        {items.length === 0 ? <p className="rounded-2xl bg-white p-6 text-zinc-600">Nenhuma notícia encontrada com esses filtros.</p> : null}
      </section>
    </main>
  );
}
