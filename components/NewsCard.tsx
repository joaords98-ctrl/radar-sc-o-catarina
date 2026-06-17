import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { StatusBadge } from './StatusBadge';
import { StatusButton } from './StatusButton';
import type { NewsItem } from '@/lib/types';

export function NewsCard({ item }: { item: NewsItem }) {
  const time = item.published_at
    ? formatDistanceToNow(new Date(item.published_at), { addSuffix: true, locale: ptBR })
    : 'sem data';

  return (
    <article className="rounded-2xl border bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-center gap-2">
        <StatusBadge status={item.status} />
        <span className="rounded-full bg-zinc-900 px-3 py-1 text-xs font-black text-white">
          Score {item.opportunity_score ?? 0}
        </span>
        {item.topic ? <span className="rounded-full bg-zinc-200 px-3 py-1 text-xs font-bold">{item.topic}</span> : null}
        {item.city ? <span className="rounded-full bg-zinc-200 px-3 py-1 text-xs font-bold">{item.city}</span> : null}
      </div>
      <h3 className="mt-4 text-xl font-black leading-tight text-zinc-950">{item.title}</h3>
      <p className="mt-2 text-sm text-zinc-500">{item.source_name ?? 'Fonte não identificada'} · {time}</p>
      {item.summary ? <p className="mt-3 line-clamp-3 text-sm leading-6 text-zinc-700">{item.summary}</p> : null}
      {item.angle ? (
        <div className="mt-4 rounded-xl bg-amber-50 p-3 text-sm text-amber-950 ring-1 ring-amber-100">
          <strong>Ângulo sugerido:</strong> {item.angle}
        </div>
      ) : null}
      <div className="mt-5 flex flex-wrap gap-2">
        <a className="rounded-xl bg-zinc-950 px-4 py-2 text-sm font-bold text-white" href={item.link} target="_blank" rel="noreferrer">
          Abrir fonte
        </a>
        <StatusButton id={item.id} status="reapurar" className="rounded-xl bg-zinc-200 px-4 py-2 text-sm font-bold text-zinc-800">
          Marcar p/ reapurar
        </StatusButton>
        <StatusButton id={item.id} status="publicado" className="rounded-xl bg-emerald-100 px-4 py-2 text-sm font-bold text-emerald-900">
          Publicado
        </StatusButton>
        <StatusButton id={item.id} status="descartado" className="rounded-xl bg-red-100 px-4 py-2 text-sm font-bold text-red-900">
          Descartar
        </StatusButton>
      </div>
    </article>
  );
}
