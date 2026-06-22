import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

type SocialSource = {
  name: string;
  domain: string | null;
  instagram_handle: string | null;
  region: string | null;
  category: string | null;
  source_type: string | null;
  priority_weight: number | null;
  notes: string | null;
};

function toUrl(domain?: string | null) {
  if (!domain) return null;
  const clean = domain.replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/$/, '');
  if (clean.startsWith('instagram.com/') || clean.startsWith('facebook.com/')) return `https://${clean}`;
  return `https://${clean}`;
}

function googleSearchUrl(source: SocialSource, intent: 'geral' | 'video' | 'transito') {
  const domain = source.domain?.replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/$/, '');
  const region = source.region ?? 'Santa Catarina';
  const baseSource = domain?.includes('instagram.com') || domain?.includes('facebook.com') ? `site:${domain}` : `"${source.name}"`;
  const terms = intent === 'video'
    ? '(vídeo OR reels OR story OR ocorrência OR denúncia OR flagrante)'
    : intent === 'transito'
      ? '(trânsito OR acidente OR rodovia OR fila OR colisão OR caminhão OR incêndio)'
      : '(notícia OR urgente OR ocorrência OR denúncia OR prefeitura OR comunidade)';
  return `https://www.google.com/search?q=${encodeURIComponent(`${baseSource} ${terms} "${region}"`)}`;
}

function groupByRegion(items: SocialSource[]) {
  return items.reduce<Record<string, SocialSource[]>>((acc, item) => {
    const key = item.region ?? 'SC';
    acc[key] = acc[key] ?? [];
    acc[key].push(item);
    return acc;
  }, {});
}

export default async function SocialSourcesPage() {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('source_profiles')
    .select('name, domain, instagram_handle, region, category, source_type, priority_weight, notes')
    .in('source_type', ['social', 'facebook_group', 'facebook_page'])
    .order('region', { ascending: true })
    .order('priority_weight', { ascending: false });

  const sources = (data ?? []) as SocialSource[];
  const grouped = groupByRegion(sources);

  return (
    <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
      <section className="rounded-3xl bg-zinc-950 p-5 text-white shadow-sm sm:p-8">
        <p className="text-xs font-black uppercase tracking-[0.25em] text-emerald-300">Radar social assistido</p>
        <h2 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">Fontes sociais e grupos comunitários</h2>
        <p className="mt-3 max-w-3xl text-sm text-zinc-300 sm:text-base">
          Esta tela organiza Instagram, Facebook, páginas e grupos por praça. O Radar não faz scraping e não acessa conteúdo privado; os botões abrem a fonte e criam buscas públicas/indexadas para achar sinais de notícia, vídeo, trânsito e denúncias.
        </p>
      </section>

      {error ? (
        <section className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-5 text-sm font-bold text-red-800">
          Erro ao carregar fontes sociais: {error.message}
        </section>
      ) : null}

      <section className="mt-6 grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500">Fontes cadastradas</p>
          <p className="mt-2 text-3xl font-black">{sources.length}</p>
        </div>
        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500">Função</p>
          <p className="mt-2 text-lg font-black">Sinal de pauta</p>
        </div>
        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500">Uso recomendado</p>
          <p className="mt-2 text-lg font-black">Checar antes de publicar</p>
        </div>
      </section>

      <div className="mt-6 space-y-6">
        {Object.entries(grouped).map(([region, items]) => (
          <section key={region} className="rounded-2xl border bg-white p-4 shadow-sm sm:p-5">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500">Praça</p>
                <h3 className="text-2xl font-black">{region}</h3>
              </div>
              <p className="text-sm font-bold text-zinc-500">{items.length} fontes</p>
            </div>
            <div className="mt-4 grid gap-3 lg:grid-cols-2">
              {items.map((source) => {
                const directUrl = toUrl(source.domain);
                return (
                  <article key={`${source.domain}-${source.name}`} className="rounded-xl border bg-zinc-50 p-4">
                    <div className="flex flex-wrap gap-2 text-xs font-black">
                      <span className="rounded-full bg-zinc-950 px-2 py-1 text-white">Peso {source.priority_weight ?? 3}</span>
                      <span className="rounded-full bg-zinc-200 px-2 py-1 text-zinc-800">{source.source_type?.replace('_', ' ') ?? 'social'}</span>
                      {source.instagram_handle ? <span className="rounded-full bg-pink-100 px-2 py-1 text-pink-900">{source.instagram_handle}</span> : null}
                    </div>
                    <h4 className="mt-3 text-lg font-black leading-tight">{source.name}</h4>
                    <p className="mt-1 text-sm font-semibold text-zinc-500">{source.category ?? 'Fonte social'} · {source.domain}</p>
                    {source.notes ? <p className="mt-2 text-sm text-zinc-600 line-clamp-2">{source.notes}</p> : null}
                    <div className="mt-4 flex flex-wrap gap-2">
                      {directUrl ? <a href={directUrl} target="_blank" rel="noreferrer" className="rounded-xl bg-zinc-900 px-3 py-2 text-xs font-bold text-white">Abrir fonte</a> : null}
                      <a href={googleSearchUrl(source, 'geral')} target="_blank" rel="noreferrer" className="rounded-xl bg-emerald-100 px-3 py-2 text-xs font-bold text-emerald-900">Buscar notícia</a>
                      <a href={googleSearchUrl(source, 'video')} target="_blank" rel="noreferrer" className="rounded-xl bg-blue-100 px-3 py-2 text-xs font-bold text-blue-900">Buscar vídeo</a>
                      <a href={googleSearchUrl(source, 'transito')} target="_blank" rel="noreferrer" className="rounded-xl bg-amber-100 px-3 py-2 text-xs font-bold text-amber-900">Trânsito/ocorrência</a>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}
