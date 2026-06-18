import { sortLabels, type RadarSort } from '@/lib/sort';

const order: RadarSort[] = ['potencial', 'recente', 'urgencia', 'concorrencia', 'instagram'];

export function SortControls({ current, baseHref }: { current: RadarSort; baseHref: string }) {
  const separator = baseHref.includes('?') ? '&' : '?';
  return (
    <div className="rounded-2xl border bg-white p-4 shadow-sm">
      <p className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500">Ordenar por</p>
      <div className="mt-3 flex gap-2 overflow-x-auto pb-1 text-sm font-bold sm:flex-wrap sm:overflow-visible sm:pb-0">
        {order.map((item) => (
          <a
            key={item}
            className={`whitespace-nowrap rounded-xl px-3 py-2 ${current === item ? 'bg-zinc-950 text-white' : 'bg-zinc-100 text-zinc-800'}`}
            href={`${baseHref}${separator}sort=${item}`}
          >
            {sortLabels[item]}
          </a>
        ))}
      </div>
    </div>
  );
}
