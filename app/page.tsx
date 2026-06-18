import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { StatCard } from '@/components/StatCard';
import { NewsCard } from '@/components/NewsCard';
import { StoryClusterCard } from '@/components/StoryClusterCard';
import type { NewsItem } from '@/lib/types';
import { ManualCollectButton } from '@/components/ManualCollectButton';
import { formatRecentWindowLabel, getRecentCutoffIso } from '@/lib/recent';
import { buildStoryGroups } from '@/lib/storyGroups';

export const dynamic = 'force-dynamic';

async function getDashboardData() {
  const supabase = getSupabaseAdmin();
  const cutoffIso = getRecentCutoffIso();

  const [
    { count: newsCount },
    { count: hotCount },
    { count: queryCount },
    { count: repercussionCount },
    { count: competitorCount },
    { data: latest },
    { data: runs },
  ] = await Promise.all([
    supabase.from('news_items').select('*', { count: 'exact', head: true }).gte('published_at', cutoffIso),
    supabase.from('news_items').select('*', { count: 'exact', head: true }).gte('published_at', cutoffIso).gte('opportunity_score', 70).neq('status', 'descartado'),
    supabase.from('rss_queries').select('*', { count: 'exact', head: true }).eq('enabled', true),
    supabase.from('news_items').select('*', { count: 'exact', head: true }).gte('published_at', cutoffIso).gte('media_repercussion_score', 60),
    supabase.from('source_profiles').select('*', { count: 'exact', head: true }).eq('is_competitor', true),
    supabase.from('news_items').select('*').gte('published_at', cutoffIso).neq('status', 'descartado').order('opportunity_score', { ascending: false }).order('published_at', { ascending: false }).limit(180),
    supabase.from('cron_runs').select('*').order('created_at', { ascending: false }).limit(1),
  ]);

  const items = (latest ?? []) as NewsItem[];
  const storyGroups = buildStoryGroups(items, 16);
  const urgentGroups = storyGroups.filter((group) => group.urgencyScore >= 75).slice(0, 4);
  const vacuumGroups = storyGroups.filter((group) => group.vacuum).slice(0, 4);
  const competitorGroups = storyGroups.filter((group) => group.competitionScore >= 60).slice(0, 4);

  return {
    newsCount: newsCount ?? 0,
    hotCount: hotCount ?? 0,
    queryCount: queryCount ?? 0,
    repercussionCount: repercussionCount ?? 0,
    competitorCount: competitorCount ?? 0,
    latest: items.slice(0, 4),
    storyGroups,
    urgentGroups,
    vacuumGroups,
    competitorGroups,
    lastRun: runs?.[0] ?? null,
    windowLabel: formatRecentWindowLabel(),
  };
}

export default async function Home() {
  const data = await getDashboardData();

  return (
    <main className="mx-auto max-w-7xl px-6 py-8">
      <section className="mb-8 rounded-3xl bg-zinc-950 p-8 text-white shadow-sm">
        <p className="text-sm font-bold uppercase tracking-[0.25em] text-zinc-400">Editor-chefe assistente</p>
        <h2 className="mt-3 max-w-4xl text-4xl font-black leading-tight">O que publicar agora em Santa Catarina.</h2>
        <p className="mt-4 max-w-4xl text-zinc-300">
          O Radar agrupa notícias repetidas, mede urgência, concorrência e repercussão editorial para mostrar as pautas que o O Catarina deve disputar primeiro.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-6">
        <StatCard label="Notícias do dia" value={data.newsCount} hint={data.windowLabel} />
        <StatCard label="Pautas agrupadas" value={data.storyGroups.length} hint="Eventos únicos detectados" />
        <StatCard label="Pautas quentes" value={data.hotCount} hint="Score acima de 70" />
        <StatCard label="Buscas ativas" value={data.queryCount} hint="Cidades, temas e regiões" />
        <StatCard label="Concorrentes" value={data.competitorCount} hint="Fontes mapeadas" />
        <StatCard label="Última coleta" value={data.lastRun ? 'Rodou' : 'Sem coleta'} hint={data.lastRun?.created_at ? new Date(data.lastRun.created_at).toLocaleString('pt-BR') : 'Rode a coleta manual'} />
      </section>

      <section className="mt-8 flex items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black">Fila: publicar agora</h2>
          <p className="text-sm text-zinc-600">Prioridade calculada por oportunidade + urgência + concorrência + repercussão. Sempre cheque fonte oficial.</p>
        </div>
        <ManualCollectButton />
      </section>

      <section className="mt-5 grid gap-4 lg:grid-cols-2">
        {data.storyGroups.slice(0, 6).map((group) => <StoryClusterCard key={group.id} group={group} />)}
        {data.storyGroups.length === 0 ? <p className="rounded-2xl bg-white p-6 text-zinc-600">Nenhuma pauta recente agrupada. Rode uma coleta.</p> : null}
      </section>

      <section className="mt-10 grid gap-6 lg:grid-cols-3">
        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <h3 className="text-lg font-black">Urgente agora</h3>
          <p className="mt-1 text-sm text-zinc-500">Pautas com publicação muito recente.</p>
          <div className="mt-4 space-y-3">
            {data.urgentGroups.map((group) => (
              <a key={group.id} className="block rounded-xl bg-zinc-50 p-3 ring-1 ring-zinc-100" href={`/stories?focus=${encodeURIComponent(group.id)}`}>
                <p className="font-black leading-tight">{group.headline}</p>
                <p className="mt-1 text-xs text-zinc-500">Urgência {group.urgencyScore} · {group.city ?? group.region ?? 'SC'}</p>
              </a>
            ))}
            {!data.urgentGroups.length ? <p className="text-sm text-zinc-500">Sem urgências detectadas.</p> : null}
          </div>
        </div>

        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <h3 className="text-lg font-black">Concorrência entrou</h3>
          <p className="mt-1 text-sm text-zinc-500">Pautas já publicadas por meios mapeados.</p>
          <div className="mt-4 space-y-3">
            {data.competitorGroups.map((group) => (
              <a key={group.id} className="block rounded-xl bg-zinc-50 p-3 ring-1 ring-zinc-100" href={`/stories?focus=${encodeURIComponent(group.id)}`}>
                <p className="font-black leading-tight">{group.headline}</p>
                <p className="mt-1 text-xs text-zinc-500">{group.competitors.slice(0, 3).join(', ') || 'Concorrente'} · score {group.competitionScore}</p>
              </a>
            ))}
            {!data.competitorGroups.length ? <p className="text-sm text-zinc-500">Sem concorrência forte detectada.</p> : null}
          </div>
        </div>

        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <h3 className="text-lg font-black">Vácuo editorial</h3>
          <p className="mt-1 text-sm text-zinc-500">Pautas quentes ainda pouco saturadas.</p>
          <div className="mt-4 space-y-3">
            {data.vacuumGroups.map((group) => (
              <a key={group.id} className="block rounded-xl bg-lime-50 p-3 ring-1 ring-lime-100" href={`/stories?focus=${encodeURIComponent(group.id)}`}>
                <p className="font-black leading-tight">{group.headline}</p>
                <p className="mt-1 text-xs text-lime-900">Boa chance de chegar antes · prioridade {group.score}</p>
              </a>
            ))}
            {!data.vacuumGroups.length ? <p className="text-sm text-zinc-500">Nenhum vácuo claro neste momento.</p> : null}
          </div>
        </div>
      </section>

      <section className="mt-10">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-black">Últimas notícias brutas</h2>
            <p className="text-sm text-zinc-600">Links individuais antes do agrupamento.</p>
          </div>
          <a className="rounded-xl bg-zinc-900 px-5 py-3 text-sm font-bold text-white" href="/stories">Ver grupos</a>
        </div>
        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          {data.latest.map((item) => <NewsCard key={item.id} item={item} />)}
        </div>
      </section>
    </main>
  );
}
