import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { StatusBadge } from './StatusBadge';
import { StatusButton } from './StatusButton';
import type { NewsItem } from '@/lib/types';
import { instagramPotentialForItem, suggestedInstagramFormatForItem } from '@/lib/instagram';
import { SendToProductionButton } from '@/components/SendToProductionButton';

export function NewsCard({ item }: { item: NewsItem }) {
  const time = item.published_at
    ? formatDistanceToNow(new Date(item.published_at), { addSuffix: true, locale: ptBR })
    : 'sem data';

  const mediaMentions = item.media_mentions_count ?? 1;
  const mediaScore = item.media_repercussion_score ?? 0;
  const competitors = item.competitor_names ?? [];
  const sources = item.top_media_sources ?? [];
  const instagramPotential = instagramPotentialForItem(item);
  const instagramFormat = suggestedInstagramFormatForItem(item);

  return (
    <article className="rounded-2xl border bg-white p-4 shadow-sm sm:p-5">
      <div className="flex flex-wrap items-center gap-2">
        <StatusBadge status={item.status} />
        <span className="rounded-full bg-zinc-900 px-3 py-1 text-xs font-black text-white">
          Score {item.opportunity_score ?? 0}
        </span>
        <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-black text-blue-900">
          Repercussão {mediaScore}
        </span>
        <span className="rounded-full bg-pink-100 px-3 py-1 text-xs font-black text-pink-900">
          Instagram {instagramPotential} · {instagramFormat}
        </span>
        <span className="rounded-full bg-purple-100 px-3 py-1 text-xs font-bold text-purple-900">
          {mediaMentions} veiculação{mediaMentions === 1 ? '' : 'ões'}
        </span>
        {item.topic ? <span className="rounded-full bg-zinc-200 px-3 py-1 text-xs font-bold">{item.topic}</span> : null}
        {item.city ? <span className="rounded-full bg-zinc-200 px-3 py-1 text-xs font-bold">{item.city}</span> : null}
      </div>
      <h3 className="mt-4 text-lg font-black sm:text-xl leading-tight text-zinc-950">{item.title}</h3>
      <p className="mt-2 text-sm text-zinc-500">{item.source_name ?? 'Fonte não identificada'} · {time}</p>
      {item.summary ? <p className="mt-3 line-clamp-3 text-sm leading-6 text-zinc-700">{item.summary}</p> : null}

      <div className="mt-4 grid gap-3 rounded-xl bg-zinc-50 p-3 text-sm ring-1 ring-zinc-100 sm:grid-cols-2">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-zinc-500">Como está na praça</p>
          <p className="mt-1 font-semibold text-zinc-800">
            {mediaMentions > 1
              ? `Detectada em ${mediaMentions} veiculações/fontes mapeadas.`
              : 'Ainda com baixa repercussão detectada.'}
          </p>
        </div>
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-zinc-500">Concorrentes</p>
          <p className="mt-1 font-semibold text-zinc-800">
            {competitors.length ? competitors.join(', ') : 'Nenhum concorrente mapeado detectado'}
          </p>
        </div>
        {sources.length ? (
          <div className="sm:col-span-2">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-zinc-500">Outros meios encontrados</p>
            <p className="mt-1 text-zinc-700">{sources.join(' · ')}</p>
          </div>
        ) : null}
      </div>

      {item.angle ? (
        <div className="mt-4 rounded-xl bg-amber-50 p-3 text-sm text-amber-950 ring-1 ring-amber-100">
          <strong>Ângulo sugerido:</strong> {item.angle}
        </div>
      ) : null}
      <div className="mt-5 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
        <a className="rounded-xl bg-zinc-950 px-4 py-2 text-center text-sm font-bold text-white" href={item.link} target="_blank" rel="noreferrer">
          Abrir fonte
        </a>
        <StatusButton id={item.id} status="reapurar" className="rounded-xl bg-zinc-200 px-4 py-2 text-center text-sm font-bold text-zinc-800">
          Marcar p/ reapurar
        </StatusButton>
        <a className="rounded-xl bg-pink-100 px-4 py-2 text-center text-sm font-bold text-pink-900" href={`/draft?newsId=${item.id}`}>
          Gerar base
        </a>
        {item.status === 'em_producao' || item.status === 'publicado' ? (
          <a className="rounded-xl bg-blue-100 px-4 py-2 text-center text-sm font-bold text-blue-950" href="/production">Na produção</a>
        ) : (
          <SendToProductionButton newsId={item.id} storyKey={item.story_key ?? null} headline={item.title} className="rounded-xl bg-blue-500 px-4 py-2 text-center text-sm font-black text-white">Enviar para pauta</SendToProductionButton>
        )}
        <StatusButton id={item.id} status="publicado" className="rounded-xl bg-emerald-100 px-4 py-2 text-center text-sm font-bold text-emerald-900">
          Publicado
        </StatusButton>
        <StatusButton id={item.id} status="descartado" className="rounded-xl bg-red-100 px-4 py-2 text-center text-sm font-bold text-red-900">
          Descartar
        </StatusButton>
      </div>
    </article>
  );
}
