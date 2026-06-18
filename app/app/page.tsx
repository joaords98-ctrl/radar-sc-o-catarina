import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { StatCard } from '@/components/StatCard';
import { NewsCard } from '@/components/NewsCard';
import { StoryClusterCard } from '@/components/StoryClusterCard';
import type { NewsItem } from '@/lib/types';
import { ManualCollectButton } from '@/components/ManualCollectButton';
import { formatRecentWindowLabel, getRecentCutoffIso } from '@/lib/recent';
import { buildStoryGroups } from '@/lib/storyGroups';
import { formatBrazilDateTimeWithZone } from '@/lib/date';

const cityFilters = ['Joinville', 'Florianópolis', 'Blumenau', 'Itajaí', 'Chapecó', 'Criciúma', 'Lages', 'Balneário Camboriú'];
const regionFilters = ['Oeste', 'Sul', 'Norte', 'Vale do Itajaí', 'Litoral Norte', 'Grande Florianópolis'];

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
    <main className="mx-auto max-w-7xl px-4 py-5 sm:px-6 sm:py-8">
      <section className="mb-8 rounded-2xl bg-zinc-950 p-5 sm:rounded-3xl sm:p-8 text-white shadow-sm">
        <p className="text-xs font-bold uppercase tracking-[0.22em] sm:text-sm sm:tracking-[0.25em] text-zinc-400">Editor-chefe assistente</p>
        <h2 className="mt-3 max-w-4xl text-2xl font-black leading-tight sm:text-4xl">O que publicar agora em Santa Catarina, no site e no Instagram.</h2>
        <p className="mt-4 max-w-4xl text-sm leading-6 text-zinc-300 sm:text-base">
          O Radar v11 reúne clipping do dia, agrupa pautas repetidas, filtra conteúdo fora de SC, mede urgência, concorrência, repercussão e potencial para Instagram. Agora você acompanha o que saiu, quem publicou primeiro e o que o O Catarina ainda precisa disputar.
        </p>
      </section>

      <section className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 xl:grid-cols-6">
        <StatCard label="Notícias do dia" value={data.newsCount} hint={data.windowLabel} />
        <StatCard label="Pautas agrupadas" value={data.storyGroups.length} hint="Eventos únicos detectados" />
        <StatCard label="Pautas quentes" value={data.hotCount} hint="Score acima de 70" />
        <StatCard label="Buscas ativas" value={data.queryCount} hint="Cidades, temas e regiões" />
        <StatCard label="Concorrentes" value={data.competitorCount} hint="Fontes mapeadas" />
        <StatCard label="Última coleta" value={data.lastRun ? 'Rodou' : 'Sem coleta'} hint={data.lastRun?.created_at ? formatBrazilDateTimeWithZone(data.lastRun.created_at) : 'Rode a coleta manual'} />
      </section>



      <section className="mt-5 rounded-2xl border bg-white p-4 shadow-sm">
        <p className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500">Atalho por cidade</p>
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1 sm:flex-wrap sm:overflow-visible sm:pb-0">
          {cityFilters.map((city) => (
            <a key={city} className="rounded-xl bg-zinc-100 px-3 py-2 text-sm font-bold text-zinc-800" href={`/stories?hours=24&city=${encodeURIComponent(city)}`}>{city}</a>
          ))}
        </div>
        <p className="mt-4 text-xs font-black uppercase tracking-[0.2em] text-zinc-500">Atalho por região</p>
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1 sm:flex-wrap sm:overflow-visible sm:pb-0">
          {regionFilters.map((region) => (
            <a key={region} className="rounded-xl bg-zinc-100 px-3 py-2 text-sm font-bold text-zinc-800" href={`/stories?hours=24&region=${encodeURIComponent(region)}`}>{region}</a>
          ))}
        </div>
      </section>

      <section className="mt-8 flex flex-col items-stretch justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-xl font-black sm:text-2xl">Fila: publicar agora</h2>
          <p className="text-sm text-zinc-600">Prioridade calculada por oportunidade + urgência + concorrência + repercussão. Sempre cheque fonte oficial.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <a className="w-full rounded-xl bg-emerald-100 px-5 py-3 text-center text-sm font-black text-emerald-900 sm:w-auto" href="/radar">Buscar notícia específica</a>
          <a className="w-full rounded-xl bg-pink-100 px-5 py-3 text-center text-sm font-black text-pink-900 sm:w-auto" href="/instagram?sort=instagram">Instagram agora</a>
          <ManualCollectButton />
        </div>
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
        <div className="flex flex-col items-stretch justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <h2 className="text-xl font-black sm:text-2xl">Últimas notícias brutas</h2>
            <p className="text-sm text-zinc-600">Links individuais antes do agrupamento.</p>
          </div>
          <a className="w-full rounded-xl bg-zinc-900 px-5 py-3 text-center text-sm font-bold text-white sm:w-auto" href="/stories">Ver grupos</a>
        </div>
        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          {data.latest.map((item) => <NewsCard key={item.id} item={item} />)}
        </div>
      </section>
    </main>
  );
}
