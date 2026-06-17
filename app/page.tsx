import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { StatCard } from '@/components/StatCard';
import { NewsCard } from '@/components/NewsCard';
import type { NewsItem } from '@/lib/types';
import { ManualCollectButton } from '@/components/ManualCollectButton';

export const dynamic = 'force-dynamic';

async function getDashboardData() {
  const supabase = getSupabaseAdmin();

  const [{ count: newsCount }, { count: hotCount }, { count: queryCount }, { data: latest }, { data: runs }] = await Promise.all([
    supabase.from('news_items').select('*', { count: 'exact', head: true }),
    supabase.from('news_items').select('*', { count: 'exact', head: true }).gte('opportunity_score', 70).neq('status', 'descartado'),
    supabase.from('rss_queries').select('*', { count: 'exact', head: true }).eq('enabled', true),
    supabase.from('news_items').select('*').neq('status', 'descartado').order('opportunity_score', { ascending: false }).order('published_at', { ascending: false }).limit(8),
    supabase.from('cron_runs').select('*').order('created_at', { ascending: false }).limit(1),
  ]);

  return {
    newsCount: newsCount ?? 0,
    hotCount: hotCount ?? 0,
    queryCount: queryCount ?? 0,
    latest: (latest ?? []) as NewsItem[],
    lastRun: runs?.[0] ?? null,
  };
}

export default async function Home() {
  const data = await getDashboardData();

  return (
    <main className="mx-auto max-w-7xl px-6 py-8">
      <section className="mb-8 rounded-3xl bg-zinc-950 p-8 text-white shadow-sm">
        <p className="text-sm font-bold uppercase tracking-[0.25em] text-zinc-400">Inteligência editorial</p>
        <h2 className="mt-3 max-w-3xl text-4xl font-black leading-tight">Radar automático de pautas para Santa Catarina.</h2>
        <p className="mt-4 max-w-3xl text-zinc-300">
          Coleta notícias via RSS/Google News, pontua oportunidades e sugere ângulos para o O Catarina reapurar e publicar com identidade própria.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-4">
        <StatCard label="Notícias capturadas" value={data.newsCount} hint="Total no banco" />
        <StatCard label="Pautas quentes" value={data.hotCount} hint="Score acima de 70" />
        <StatCard label="Buscas ativas" value={data.queryCount} hint="Cidades, temas e regiões" />
        <StatCard label="Última coleta" value={data.lastRun ? 'Rodou' : 'Sem coleta'} hint={data.lastRun?.created_at ? new Date(data.lastRun.created_at).toLocaleString('pt-BR') : 'Rode a coleta manual'} />
      </section>

      <section className="mt-8 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black">Oportunidades do dia</h2>
          <p className="text-sm text-zinc-600">Priorize as notícias com maior score e sempre cheque fonte oficial antes de publicar.</p>
        </div>
        <ManualCollectButton />
      </section>

      <section className="mt-5 grid gap-4 lg:grid-cols-2">
        {data.latest.map((item) => <NewsCard key={item.id} item={item} />)}
      </section>
    </main>
  );
}
