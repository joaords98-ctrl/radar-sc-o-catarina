import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { NewsItem } from '@/lib/types';
import { buildInstagramDraftForItem, instagramActionForItem, instagramPotentialForItem } from '@/lib/instagram';

const formatLabels = {
  reels: 'Reels',
  feed: 'Feed',
  story: 'Stories',
  carrossel: 'Carrossel',
  monitorar: 'Monitorar',
};

export function InstagramOpportunityCard({ item }: { item: NewsItem }) {
  const potential = instagramPotentialForItem(item);
  const draft = buildInstagramDraftForItem(item);
  const time = item.published_at ? formatDistanceToNow(new Date(item.published_at), { addSuffix: true, locale: ptBR }) : 'sem data';

  return (
    <article className="rounded-2xl border bg-white p-4 shadow-sm sm:p-5">
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-pink-100 px-3 py-1 text-xs font-black text-pink-900">Instagram {potential}</span>
        <span className="rounded-full bg-zinc-950 px-3 py-1 text-xs font-black text-white">{formatLabels[draft.format]}</span>
        {item.city ? <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-bold text-zinc-800">{item.city}</span> : null}
        {item.topic ? <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-bold text-zinc-800">{item.topic}</span> : null}
      </div>

      <h3 className="mt-4 text-lg font-black leading-tight text-zinc-950 sm:text-xl">{item.title}</h3>
      <p className="mt-2 text-sm text-zinc-500">{item.source_name ?? 'Fonte não identificada'} · {time}</p>

      <div className="mt-4 rounded-xl bg-pink-50 p-3 text-sm text-pink-950 ring-1 ring-pink-100">
        <p><strong>Ação Instagram:</strong> {instagramActionForItem(item)}</p>
      </div>

      <div className="mt-4 grid gap-3 rounded-xl bg-zinc-50 p-3 text-sm ring-1 ring-zinc-100 sm:grid-cols-2">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-zinc-500">Legenda-base</p>
          <p className="mt-1 line-clamp-4 text-zinc-700">{draft.caption}</p>
        </div>
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-zinc-500">Roteiro curto</p>
          <p className="mt-1 line-clamp-4 text-zinc-700">{draft.reels}</p>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
        <a className="rounded-xl bg-zinc-950 px-4 py-2 text-center text-sm font-bold text-white" href={`/draft?newsId=${item.id}`}>Gerar base</a>
        <a className="rounded-xl bg-pink-100 px-4 py-2 text-center text-sm font-bold text-pink-900" href={item.link} target="_blank" rel="noreferrer">Abrir fonte</a>
      </div>
    </article>
  );
}
