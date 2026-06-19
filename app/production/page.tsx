import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import type { EditorialTask, NewsItem } from '@/lib/types';
import { ProductionTaskButton } from '@/components/ProductionTaskButton';
import { StatusBadge } from '@/components/StatusBadge';
import { formatBrazilDateTimeWithZone } from '@/lib/date';

export const dynamic = 'force-dynamic';

const statusLabels: Record<string, string> = {
  todos: 'Todas',
  pendente: 'Aguardando',
  fazendo: 'Em produção',
  feito: 'Publicadas',
  cancelado: 'Descartadas',
};

const statusClasses: Record<string, string> = {
  pendente: 'bg-amber-100 text-amber-950 ring-1 ring-amber-200',
  fazendo: 'bg-blue-100 text-blue-950 ring-1 ring-blue-200',
  feito: 'bg-emerald-100 text-emerald-950 ring-1 ring-emerald-200',
  cancelado: 'bg-red-100 text-red-950 ring-1 ring-red-200',
};

function buildHref(path: string, params: Record<string, string | number | undefined>) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== '') search.set(key, String(value));
  }
  const qs = search.toString();
  return qs ? `${path}?${qs}` : path;
}

function taskCopy(task: EditorialTask) {
  const item = task.news_items;
  if (!item) return 'Pauta sem notícia vinculada.';
  return [
    `PAUTA: ${item.title}`,
    `Cidade/região: ${item.city ?? item.region ?? 'SC'}`,
    `Tema: ${item.topic ?? 'Não classificado'}`,
    `Fonte: ${item.source_name ?? item.source_domain ?? 'Não identificada'}`,
    `Link: ${item.link}`,
    `Score: ${item.opportunity_score ?? 0}`,
    `Status: ${item.status}`,
    item.angle ? `Ângulo: ${item.angle}` : null,
    item.summary ? `Resumo: ${item.summary}` : null,
  ].filter(Boolean).join('\n');
}

function ProductionCard({ task }: { task: EditorialTask }) {
  const item = task.news_items as NewsItem | null | undefined;

  return (
    <article className="rounded-2xl border bg-white p-4 shadow-sm sm:p-5">
      <div className="flex flex-wrap items-center gap-2">
        <span className={`rounded-full px-3 py-1 text-xs font-black ${statusClasses[task.status] ?? 'bg-zinc-100 text-zinc-900'}`}>{statusLabels[task.status] ?? task.status}</span>
        {item ? <StatusBadge status={item.status} /> : null}
        {item?.topic ? <span className="rounded-full bg-zinc-200 px-3 py-1 text-xs font-bold text-zinc-800">{item.topic}</span> : null}
        {item?.city ? <span className="rounded-full bg-zinc-200 px-3 py-1 text-xs font-bold text-zinc-800">{item.city}</span> : null}
        <span className="rounded-full bg-zinc-950 px-3 py-1 text-xs font-black text-white">Score {item?.opportunity_score ?? 0}</span>
      </div>

      <h3 className="mt-4 text-lg font-black leading-tight text-zinc-950 sm:text-xl">{item?.title ?? 'Pauta sem notícia vinculada'}</h3>
      <p className="mt-2 text-sm text-zinc-500">
        {item?.source_name ?? 'Fonte não identificada'} · enviado para pauta {formatBrazilDateTimeWithZone(task.created_at)}
      </p>
      {item?.summary ? <p className="mt-3 line-clamp-3 text-sm leading-6 text-zinc-700">{item.summary}</p> : null}

      {item?.angle ? (
        <div className="mt-4 rounded-xl bg-amber-50 p-3 text-sm leading-6 text-amber-950 ring-1 ring-amber-100">
          <strong>Ângulo:</strong> {item.angle}
        </div>
      ) : null}

      <div className="mt-5 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
        {item ? <a className="rounded-xl bg-zinc-950 px-4 py-2 text-center text-sm font-bold text-white" href={item.link} target="_blank" rel="noreferrer">Abrir fonte</a> : null}
        {item ? <a className="rounded-xl bg-emerald-100 px-4 py-2 text-center text-sm font-bold text-emerald-950" href={`/draft?newsId=${item.id}`}>Gerar base</a> : null}
        <a className="rounded-xl bg-zinc-200 px-4 py-2 text-center text-sm font-bold text-zinc-800" href={`data:text/plain;charset=utf-8,${encodeURIComponent(taskCopy(task))}`} download="pauta-o-catarina.txt">Baixar pauta</a>
        {task.status !== 'fazendo' ? <ProductionTaskButton taskId={task.id} newsId={item?.id} taskStatus="fazendo" newsStatus="em_producao" className="rounded-xl bg-blue-100 px-4 py-2 text-sm font-bold text-blue-950">Em produção</ProductionTaskButton> : null}
        {item ? <ProductionTaskButton taskId={task.id} newsId={item.id} taskStatus="feito" newsStatus="publicado" className="rounded-xl bg-emerald-100 px-4 py-2 text-sm font-bold text-emerald-950">Marcar publicada</ProductionTaskButton> : null}
        {item ? <ProductionTaskButton taskId={task.id} newsId={item.id} taskStatus="pendente" newsStatus="reapurar" className="rounded-xl bg-amber-100 px-4 py-2 text-sm font-bold text-amber-950">Reapurar</ProductionTaskButton> : null}
        {item ? <ProductionTaskButton taskId={task.id} newsId={item.id} taskStatus="cancelado" newsStatus="descartado" className="rounded-xl bg-red-100 px-4 py-2 text-sm font-bold text-red-950">Descartar</ProductionTaskButton> : null}
      </div>
    </article>
  );
}

export default async function ProductionPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const status = typeof params.status === 'string' ? params.status : 'ativos';
  const supabase = getSupabaseAdmin();

  let query = supabase
    .from('editorial_tasks')
    .select('*, news_items(*)')
    .eq('task_type', 'pauta_editorial')
    .order('created_at', { ascending: false })
    .limit(150);

  if (status === 'ativos') query = query.in('status', ['pendente', 'fazendo']);
  else if (status !== 'todos') query = query.eq('status', status);

  const { data, error } = await query;
  if (error) throw error;

  const tasks = (data ?? []) as EditorialTask[];
  const pending = tasks.filter((task) => task.status === 'pendente').length;
  const doing = tasks.filter((task) => task.status === 'fazendo').length;
  const done = tasks.filter((task) => task.status === 'feito').length;

  return (
    <main className="mx-auto max-w-7xl px-4 py-5 sm:px-6 sm:py-8">
      <section className="rounded-2xl bg-zinc-950 p-5 text-white shadow-sm sm:rounded-3xl sm:p-8">
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-emerald-300 sm:text-sm sm:tracking-[0.25em]">Produção</p>
        <h2 className="mt-3 max-w-4xl text-2xl font-black leading-tight sm:text-4xl">As pautas que você decidiu publicar.</h2>
        <p className="mt-4 max-w-4xl text-sm leading-6 text-zinc-300 sm:text-base">
          Aqui entram apenas as notícias enviadas pelo botão “Enviar para pauta”. É a fila de trabalho do O Catarina: apurar, gerar base, publicar ou descartar.
        </p>
      </section>

      <section className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-2xl bg-white p-5 shadow-sm"><p className="text-sm font-bold text-zinc-500">Na fila</p><p className="mt-2 text-3xl font-black">{tasks.length}</p></div>
        <div className="rounded-2xl bg-white p-5 shadow-sm"><p className="text-sm font-bold text-zinc-500">Aguardando</p><p className="mt-2 text-3xl font-black">{pending}</p></div>
        <div className="rounded-2xl bg-white p-5 shadow-sm"><p className="text-sm font-bold text-zinc-500">Em produção</p><p className="mt-2 text-3xl font-black">{doing}</p></div>
        <div className="rounded-2xl bg-white p-5 shadow-sm"><p className="text-sm font-bold text-zinc-500">Publicadas</p><p className="mt-2 text-3xl font-black">{done}</p></div>
      </section>

      <section className="mt-5 rounded-2xl border bg-white p-4 shadow-sm">
        <p className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500">Status da produção</p>
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1 sm:flex-wrap sm:overflow-visible sm:pb-0">
          <a className={`whitespace-nowrap rounded-xl px-4 py-2 text-sm font-black ${status === 'ativos' ? 'bg-zinc-950 text-white' : 'bg-zinc-100 text-zinc-800'}`} href="/production?status=ativos">Ativas</a>
          {['pendente', 'fazendo', 'feito', 'cancelado', 'todos'].map((item) => (
            <a key={item} className={`whitespace-nowrap rounded-xl px-4 py-2 text-sm font-black ${status === item ? 'bg-zinc-950 text-white' : 'bg-zinc-100 text-zinc-800'}`} href={buildHref('/production', { status: item })}>{statusLabels[item] ?? item}</a>
          ))}
          <a className="whitespace-nowrap rounded-xl bg-zinc-100 px-4 py-2 text-sm font-bold text-zinc-800" href="/admin/news">Ver base bruta</a>
        </div>
      </section>

      <section className="mt-6 grid gap-4 lg:grid-cols-2">
        {tasks.map((task) => <ProductionCard key={task.id} task={task} />)}
        {!tasks.length ? <p className="rounded-2xl bg-white p-6 text-zinc-600">Nenhuma pauta nessa fila. Vá ao Clipping e clique em “Enviar para pauta”.</p> : null}
      </section>
    </main>
  );
}
