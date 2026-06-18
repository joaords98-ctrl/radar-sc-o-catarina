import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import type { NewsItem } from '@/lib/types';
import { buildStoryGroups } from '@/lib/storyGroups';
import { formatRecentWindowLabel, getRecentCutoffIso } from '@/lib/recent';

export const dynamic = 'force-dynamic';

type CompetitorSource = {
  id: string;
  name: string;
  domain: string | null;
  instagram_handle: string | null;
  region: string | null;
  category: string | null;
  priority_weight: number | null;
  is_competitor: boolean | null;
};

async function getData() {
  const supabase = getSupabaseAdmin();
  const cutoffIso = getRecentCutoffIso();

  const [{ data: stories, error: storiesError }, { data: sources, error: sourcesError }] = await Promise.all([
    supabase
      .from('news_items')
      .select('*')
      .gte('published_at', cutoffIso)
      .neq('status', 'descartado')
      .order('media_repercussion_score', { ascending: false })
      .order('media_mentions_count', { ascending: false })
      .limit(250),
    supabase
      .from('source_profiles')
      .select('*')
      .eq('is_competitor', true)
      .order('priority_weight', { ascending: false })
      .order('name', { ascending: true }),
  ]);

  if (storiesError) throw storiesError;
  if (sourcesError) throw sourcesError;

  const groups = buildStoryGroups((stories ?? []) as NewsItem[], 60);
  return {
    groups,
    sources: (sources ?? []) as CompetitorSource[],
  };
}

function uniq<T>(arr: T[]) {
  return Array.from(new Set(arr));
}

export default async function CompetitorsPage() {
  const { groups, sources } = await getData();
  const withCompetitor = groups.filter((group) => group.competitors.length > 0);
  const withRepercussion = groups.filter((group) => group.competitionScore >= 60 || group.mentions >= 3);
  const topCompetitors = uniq(withCompetitor.flatMap((group) => group.competitors)).slice(0, 12);

  return (
    <main className="mx-auto max-w-7xl px-6 py-8">
      <section className="rounded-3xl bg-zinc-950 p-8 text-white shadow-sm">
        <p className="text-sm font-bold uppercase tracking-[0.25em] text-zinc-400">Análise da concorrência</p>
        <h2 className="mt-3 max-w-4xl text-4xl font-black leading-tight">Quem publicou primeiro, quem repercutiu e onde o O Catarina deve entrar.</h2>
        <p className="mt-4 max-w-4xl text-zinc-300">
          O painel mostra apenas pautas recentes ({formatRecentWindowLabel()}) e calcula um score de concorrência por número de veiculações, diversidade de fontes e presença em veículos mapeados. Não é métrica oficial de likes/comentários do Instagram.
        </p>
      </section>

      <section className="mt-6 grid gap-4 md:grid-cols-4">
        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <p className="text-sm font-bold text-zinc-500">Fontes concorrentes</p>
          <p className="mt-2 text-4xl font-black">{sources.length}</p>
          <p className="mt-1 text-sm text-zinc-500">Portais e meios cadastrados</p>
        </div>
        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <p className="text-sm font-bold text-zinc-500">Pautas com concorrente</p>
          <p className="mt-2 text-4xl font-black">{withCompetitor.length}</p>
          <p className="mt-1 text-sm text-zinc-500">Eventos detectados nos veículos mapeados</p>
        </div>
        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <p className="text-sm font-bold text-zinc-500">Alta repercussão</p>
          <p className="mt-2 text-4xl font-black">{withRepercussion.length}</p>
          <p className="mt-1 text-sm text-zinc-500">Eventos com tração editorial</p>
        </div>
        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <p className="text-sm font-bold text-zinc-500">Concorrentes ativos</p>
          <p className="mt-2 text-xl font-black leading-tight">{topCompetitors.length ? topCompetitors.slice(0, 3).join(', ') : 'Sem dados'}</p>
          <p className="mt-1 text-sm text-zinc-500">Janela atual: {formatRecentWindowLabel()}</p>
        </div>
      </section>

      <section className="mt-8 grid gap-6 lg:grid-cols-[1fr_360px]">
        <div>
          <div className="mb-4 flex items-end justify-between gap-4">
            <div>
              <h3 className="text-2xl font-black">Pautas por concorrência</h3>
              <p className="text-sm text-zinc-600">Agrupadas por evento, não por link isolado.</p>
            </div>
            <a className="rounded-xl bg-zinc-900 px-4 py-2 text-sm font-bold text-white" href="/stories">Abrir pautas</a>
          </div>

          <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">
            <table className="w-full min-w-[920px] text-left text-sm">
              <thead className="bg-zinc-100 text-xs uppercase tracking-wide text-zinc-500">
                <tr>
                  <th className="px-4 py-3">Pauta</th>
                  <th className="px-4 py-3">Concorrência</th>
                  <th className="px-4 py-3">Concorrentes</th>
                  <th className="px-4 py-3">Fontes</th>
                  <th className="px-4 py-3">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {groups.map((group) => (
                  <tr key={group.id} className="align-top">
                    <td className="px-4 py-4">
                      <p className="font-black leading-tight text-zinc-950">{group.headline}</p>
                      <p className="mt-1 text-xs text-zinc-500">{group.topic ?? 'Tema não classificado'} · {group.city ?? group.region ?? 'SC'} · prioridade {group.score}</p>
                    </td>
                    <td className="px-4 py-4">
                      <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-black text-blue-900">Score {group.competitionScore}</span>
                      <p className="mt-2 text-xs text-zinc-600">{group.mentions} veiculação{group.mentions === 1 ? '' : 'ões'}</p>
                    </td>
                    <td className="px-4 py-4 text-xs font-semibold text-zinc-700">
                      {group.competitors.length ? group.competitors.join(', ') : '—'}
                    </td>
                    <td className="px-4 py-4 text-xs text-zinc-600">
                      {group.sources.length ? group.sources.slice(0, 5).join(' · ') : '—'}
                    </td>
                    <td className="px-4 py-4">
                      <a className="rounded-lg bg-zinc-900 px-3 py-2 text-xs font-bold text-white" href={`/stories?focus=${encodeURIComponent(group.id)}`}>Ver</a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <aside className="space-y-4">
          <div className="rounded-2xl border bg-white p-5 shadow-sm">
            <h3 className="text-lg font-black">Concorrentes mapeados</h3>
            <div className="mt-4 space-y-3">
              {sources.slice(0, 18).map((source) => (
                <div key={source.id} className="rounded-xl bg-zinc-50 p-3 ring-1 ring-zinc-100">
                  <p className="font-black">{source.name}</p>
                  <p className="text-xs text-zinc-500">{source.instagram_handle ?? source.domain ?? 'sem handle'} · peso {source.priority_weight ?? 3}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border bg-amber-50 p-5 text-sm text-amber-950 shadow-sm ring-1 ring-amber-100">
            <h3 className="font-black">Leitura correta da métrica</h3>
            <p className="mt-2 leading-6">
              “Concorrência” é proxy editorial: presença em múltiplos veículos, fontes e concorrentes. Para likes, comentários, alcance e salvamentos do Instagram, use relatório/API oficial da Meta.
            </p>
          </div>
        </aside>
      </section>
    </main>
  );
}
