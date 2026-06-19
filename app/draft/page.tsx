import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import type { NewsItem } from '@/lib/types';
import { DraftCopyPanel } from '@/components/CopyBlock';
import { buildInstagramDraftForItem } from '@/lib/instagram';

export const dynamic = 'force-dynamic';

function buildDraft(item: NewsItem) {
  const city = item.city ?? item.region ?? 'Santa Catarina';
  const topic = item.topic ?? 'notícia';
  const source = item.source_name ?? 'fonte inicial';
  const title = item.title.replace(/\s+/g, ' ').trim();
  const siteTitle = title.length > 95 ? `${title.slice(0, 92)}...` : title;
  const supportLine = 'Pauta entrou no radar e deve ser checada em fonte oficial antes da publicação.';
  const body = `Uma nova pauta sobre **${topic}** em **${city}** entrou no radar editorial do **O Catarina**. A informação inicial foi localizada em **${source}** e deve ser reapurada antes da publicação final.\n\nA orientação é confirmar **local, data, fonte oficial, envolvidos e desdobramentos**. Após a checagem, o texto pode ser publicado com foco no impacto para a população local.\n\n**Fonte inicial para checagem:** ${item.link}`;
  const instagramDraft = buildInstagramDraftForItem(item);
  return { siteTitle, supportLine, body, instagram: instagramDraft.caption, video: instagramDraft.reels };
}

export default async function DraftPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const newsId = typeof params.newsId === 'string' ? params.newsId : undefined;

  if (!newsId) {
    return (
      <main className="mx-auto max-w-5xl px-4 py-5 sm:px-6 sm:py-8">
        <h2 className="text-2xl font-black sm:text-3xl">Gerador de base editorial</h2>
        <p className="mt-3 rounded-2xl bg-white p-5 text-zinc-600">Abra uma pauta pelo dashboard e clique em “Gerar base”.</p>
      </main>
    );
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase.from('news_items').select('*').eq('id', newsId).single();
  if (error) throw error;
  const item = data as NewsItem;
  const draft = buildDraft(item);

  return (
    <main className="mx-auto max-w-5xl px-4 py-5 sm:px-6 sm:py-8">
      <section className="rounded-2xl bg-zinc-950 p-5 text-white shadow-sm sm:rounded-3xl sm:p-8">
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-zinc-400 sm:text-sm sm:tracking-[0.25em]">Base editorial v13</p>
        <h2 className="mt-3 text-2xl font-black leading-tight sm:text-4xl">Texto-base para site e Instagram.</h2>
        <p className="mt-4 max-w-3xl text-sm leading-6 text-zinc-300 sm:text-base">Use como rascunho, não como cópia automática. Antes de publicar, confirme fonte oficial e ajuste o ângulo do O Catarina.</p>
      </section>

      <DraftCopyPanel draft={draft} />
    </main>
  );
}
