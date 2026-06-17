import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { NewsCard } from '@/components/NewsCard';
import type { NewsItem } from '@/lib/types';
import { formatRecentWindowLabel, getRecentCutoffIso } from '@/lib/recent';

export const dynamic = 'force-dynamic';

export default async function NewsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const status = typeof params.status === 'string' ? params.status : undefined;
  const topic = typeof params.topic === 'string' ? params.topic : undefined;
  const city = typeof params.city === 'string' ? params.city : undefined;

  const supabase = getSupabaseAdmin();
  const cutoffIso = getRecentCutoffIso();
  let query = supabase.from('news_items').select('*').gte('published_at', cutoffIso).order('opportunity_score', { ascending: false }).order('published_at', { ascending: false }).limit(80);

  if (status) query = query.eq('status', status);
  if (topic) query = query.eq('topic', topic);
  if (city) query = query.eq('city', city);

  const { data, error } = await query;
  if (error) throw error;
  const items = (data ?? []) as NewsItem[];

  return (
    <main className="mx-auto max-w-7xl px-6 py-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black">Central de notícias do dia</h2>
          <p className="mt-2 text-sm text-zinc-600">Filtro padrão: {formatRecentWindowLabel()}. Use como fila editorial: fonte, checagem, ângulo próprio e publicação.</p>
        </div>
        <div className="flex flex-wrap gap-2 text-sm font-bold">
          <a className="rounded-xl bg-zinc-200 px-4 py-2" href="/news">Hoje</a>
          <a className="rounded-xl bg-zinc-200 px-4 py-2" href="/news?status=novo">Novas</a>
          <a className="rounded-xl bg-zinc-200 px-4 py-2" href="/news?status=reapurar">Reapurar</a>
          <a className="rounded-xl bg-zinc-200 px-4 py-2" href="/news?status=publicado">Publicadas</a>
        </div>
      </div>

      <section className="mt-6 grid gap-4 lg:grid-cols-2">
        {items.map((item) => <NewsCard key={item.id} item={item} />)}
        {items.length === 0 ? <p className="rounded-2xl bg-white p-6 text-zinc-600">Nenhuma notícia encontrada com esses filtros.</p> : null}
      </section>
    </main>
  );
}
