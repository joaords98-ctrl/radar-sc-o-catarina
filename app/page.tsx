import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { StatCard } from '@/components/StatCard';
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

  return {
    newsCount: newsCount ?? 0,
    hotCount: hotCount ?? 0,
    queryCount: queryCount ?? 0,
    repercussionCount: repercussionCount ?? 0,
    competitorCount: competitorCount ?? 0,
    storyGroups,
    lastRun: runs?.[0] ?? null,
    windowLabel: formatRecentWindowLabel(),
  };
}

function ActionCard({ title, text, href, label, tone = 'dark' }: { title: string; text: string; href: string; label: string; tone?: 'dark' | 'green' | 'pink' | 'blue' }) {
  const styles = {
    dark: 'bg-zinc-950 text-white',
    green: 'bg-emerald-100 text-emerald-950 ring-1 ring-emerald-200',
    pink: 'bg-pink-100 text-pink-950 ring-1 ring-pink-200',
    blue: 'bg-blue-100 text-blue-950 ring-1 ring-blue-200',
  }[tone];

  return (
    <a href={href} className={`rounded-2xl p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${styles}`}>
      <p className="text-xs font-black uppercase tracking-[0.2em] opacity-70">{label}</p>
      <h3 className="mt-3 text-xl font-black leading-tight">{title}</h3>
      <p className="mt-3 text-sm leading-6 opacity-80">{text}</p>
    </a>
  );
}

export default async function Home() {
  const data = await getDashboardData();
  const topGroups = data.storyGroups.slice(0, 4);

  return (
    <main className="mx-auto max-w-7xl px-4 py-5 sm:px-6 sm:py-8">
      <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-zinc-200 sm:p-7">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.25em] text-zinc-500">Mesa de operação</p>
            <h2 className="mt-3 max-w-4xl text-3xl font-black leading-tight text-zinc-950 sm:text-5xl">Clipping primeiro. Produção depois.</h2>
            <p className="mt-4 max-w-3xl text-sm leading-6 text-zinc-600 sm:text-base">
              Use o Radar em ordem simples: veja o clipping, clique em “Enviar para pauta”, produza o texto, publique e acompanhe a concorrência.
            </p>
          </div>
          <div className="rounded-2xl bg-zinc-100 p-4 text-sm text-zinc-700 lg:w-80">
            <p className="font-black text-zinc-950">Última coleta</p>
            <p className="mt-1">{data.lastRun?.created_at ? formatBrazilDateTimeWithZone(data.lastRun.created_at) : 'Sem coleta recente'}</p>
            <div className="mt-3">
              <ManualCollectButton />
            </div>
          </div>
        </div>
      </section>

      <section className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <ActionCard label="1º passo" title="Abrir clipping" text="Resumo do dia, fontes, cidades quentes e pautas que ainda não viraram publicação." href="/clipping?hours=24&sort=potencial" tone="dark" />
        <ActionCard label="2º passo" title="Buscar notícia específica" text="Digite cidade, rodovia, tema ou frase da notícia para caçar pauta em SC." href="/radar" tone="green" />
        <ActionCard label="3º passo" title="Fila de produção" text="Veja só as pautas que você separou para publicar, com status e botões de produção." href="/production" tone="blue" />
        <ActionCard label="4º passo" title="Instagram agora" text="Veja o que rende Reels, Feed ou Story, com score de potencial para redes." href="/instagram?hours=24&sort=instagram" tone="pink" />
      </section>

      <section className="mt-5 grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 xl:grid-cols-6">
        <StatCard label="Notícias do dia" value={data.newsCount} hint={data.windowLabel} />
        <StatCard label="Pautas agrupadas" value={data.storyGroups.length} hint="Eventos únicos" />
        <StatCard label="Pautas quentes" value={data.hotCount} hint="Score acima de 70" />
        <StatCard label="Buscas ativas" value={data.queryCount} hint="Cidades e temas" />
        <StatCard label="Concorrentes" value={data.competitorCount} hint="Fontes mapeadas" />
        <StatCard label="Repercussão" value={data.repercussionCount} hint="Pautas com tração" />
      </section>

      <section className="mt-5 rounded-2xl border bg-white p-4 shadow-sm">
        <p className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500">Atalhos rápidos</p>
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1 sm:flex-wrap sm:overflow-visible sm:pb-0">
          <a className="rounded-xl bg-zinc-950 px-3 py-2 text-sm font-black text-white" href="/clipping?hours=24&mode=pendentes">Não publicadas</a>
          <a className="rounded-xl bg-zinc-100 px-3 py-2 text-sm font-bold text-zinc-800" href="/clipping?hours=24&mode=urgentes">Urgentes</a>
          <a className="rounded-xl bg-zinc-100 px-3 py-2 text-sm font-bold text-zinc-800" href="/clipping?hours=24&mode=oficiais">Com fonte oficial</a>
          <a className="rounded-xl bg-blue-100 px-3 py-2 text-sm font-bold text-blue-950" href="/production">Fila de produção</a>
          {cityFilters.map((city) => (
            <a key={city} className="rounded-xl bg-zinc-100 px-3 py-2 text-sm font-bold text-zinc-800" href={`/clipping?hours=24&city=${encodeURIComponent(city)}`}>{city}</a>
          ))}
          {regionFilters.map((region) => (
            <a key={region} className="rounded-xl bg-zinc-100 px-3 py-2 text-sm font-bold text-zinc-800" href={`/clipping?hours=24&region=${encodeURIComponent(region)}`}>{region}</a>
          ))}
        </div>
      </section>

      <section className="mt-8 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-xl font-black sm:text-2xl">Fila resumida</h2>
          <p className="text-sm text-zinc-600">As 4 pautas com maior prioridade no clipping. Clique em “Enviar para pauta” para colocar na fila de produção.</p>
        </div>
        <a className="rounded-xl bg-zinc-950 px-5 py-3 text-center text-sm font-black text-white" href="/clipping?hours=24&sort=potencial">Ver clipping completo</a>
      </section>

      <section className="mt-5 grid gap-4 lg:grid-cols-2">
        {topGroups.map((group) => <StoryClusterCard key={group.id} group={group} />)}
        {topGroups.length === 0 ? <p className="rounded-2xl bg-white p-6 text-zinc-600">Nenhuma pauta recente agrupada. Rode uma coleta.</p> : null}
      </section>
    </main>
  );
}
