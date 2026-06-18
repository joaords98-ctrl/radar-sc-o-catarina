import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { StoryGroup } from '@/lib/storyGroups';
import { instagramPotentialForGroup, suggestedInstagramFormatForGroup } from '@/lib/instagram';

const formatLabels: Record<StoryGroup['suggestedFormat'], string> = {
  site: 'Matéria site',
  feed: 'Feed',
  reels: 'Reels',
  story: 'Story/nota',
  apurar: 'Apurar antes',
};

const riskLabels: Record<StoryGroup['riskLevel'], string> = {
  baixo: 'Risco baixo',
  medio: 'Risco médio',
  alto: 'Risco alto',
};

export function StoryClusterCard({ group }: { group: StoryGroup }) {
  const instagramPotential = instagramPotentialForGroup(group);
  const instagramFormat = suggestedInstagramFormatForGroup(group);
  const time = group.latestPublishedAt
    ? formatDistanceToNow(new Date(group.latestPublishedAt), { addSuffix: true, locale: ptBR })
    : 'sem data';

  return (
    <article className="rounded-2xl border bg-white p-4 shadow-sm sm:p-5">
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-zinc-950 px-3 py-1 text-xs font-black text-white">Prioridade {group.score}</span>
        <span className="rounded-full bg-orange-100 px-3 py-1 text-xs font-black text-orange-900">Urgência {group.urgencyScore}</span>
        <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-black text-blue-900">Concorrência {group.competitionScore}</span>
        <span className="rounded-full bg-pink-100 px-3 py-1 text-xs font-black text-pink-900">Instagram {instagramPotential}</span>
        <span className="rounded-full bg-purple-100 px-3 py-1 text-xs font-bold text-purple-900">{group.mentions} veiculação{group.mentions === 1 ? '' : 'ões'}</span>
        <span className={`rounded-full px-3 py-1 text-xs font-black ${group.riskLevel === 'alto' ? 'bg-red-100 text-red-900' : group.riskLevel === 'medio' ? 'bg-amber-100 text-amber-900' : 'bg-emerald-100 text-emerald-900'}`}>{riskLabels[group.riskLevel]}</span>
        {group.vacuum ? <span className="rounded-full bg-lime-100 px-3 py-1 text-xs font-black text-lime-900">Vácuo editorial</span> : null}
      </div>

      <h3 className="mt-4 text-lg font-black sm:text-xl leading-tight text-zinc-950">{group.headline}</h3>
      <p className="mt-2 text-sm text-zinc-500">
        {group.topic ?? 'Tema não classificado'} · {group.city ?? group.region ?? 'SC'} · atualizado {time}
      </p>

      <div className="mt-4 grid gap-3 rounded-xl bg-zinc-50 p-3 text-sm ring-1 ring-zinc-100 sm:grid-cols-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-zinc-500">Primeiro meio</p>
          <p className="mt-1 font-semibold text-zinc-800">{group.firstSource ?? 'Não identificado'}</p>
        </div>
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-zinc-500">Concorrentes</p>
          <p className="mt-1 font-semibold text-zinc-800">{group.competitors.length ? group.competitors.join(', ') : 'Nenhum mapeado'}</p>
        </div>
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-zinc-500">Formato</p>
          <p className="mt-1 font-semibold text-zinc-800">{formatLabels[group.suggestedFormat]} · Insta: {instagramFormat}</p>
        </div>
        <div className="sm:col-span-3">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-zinc-500">Outros meios</p>
          <p className="mt-1 text-zinc-700">{group.sources.length ? group.sources.slice(0, 8).join(' · ') : 'Sem fontes agrupadas'}</p>
        </div>
      </div>

      <div className="mt-4 rounded-xl bg-amber-50 p-3 text-sm text-amber-950 ring-1 ring-amber-100">
        <p><strong>Ação sugerida:</strong> {group.action}</p>
        <p className="mt-2"><strong>Ângulo:</strong> {group.angle}</p>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
        <a className="rounded-xl bg-zinc-950 px-4 py-2 text-center text-sm font-bold text-white" href={group.leadItem.link} target="_blank" rel="noreferrer">Abrir principal</a>
        <a className="rounded-xl bg-zinc-200 px-4 py-2 text-center text-sm font-bold text-zinc-800" href={`/stories?focus=${encodeURIComponent(group.id)}`}>Ver grupo</a>
        <a className="rounded-xl bg-emerald-100 px-4 py-2 text-center text-sm font-bold text-emerald-900" href={`/draft?newsId=${group.leadItem.id}`}>Gerar base</a>
        <a className="rounded-xl bg-pink-100 px-4 py-2 text-center text-sm font-bold text-pink-900" href={`/instagram?sort=instagram&city=${encodeURIComponent(group.city ?? '')}`}>Instagram</a>
      </div>
    </article>
  );
}
