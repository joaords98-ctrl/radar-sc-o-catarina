import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import type { NewsItem } from '@/lib/types';
import { DraftCopyPanel } from '@/components/CopyBlock';

export const dynamic = 'force-dynamic';

function buildDraft(item: NewsItem) {
  const city = item.city ?? item.region ?? 'Santa Catarina';
  const topic = item.topic ?? 'notícia';
  const source = item.source_name ?? 'fonte inicial';
  const title = item.title.replace(/\s+/g, ' ').trim();
  const siteTitle = title.length > 95 ? `${title.slice(0, 92)}...` : title;
  const supportLine = `Caso foi identificado a partir de publicação de ${source} e precisa de checagem em fonte oficial.`;
  const body = `Uma nova pauta sobre ${topic} em ${city} entrou no radar editorial do O Catarina. A informação inicial foi localizada em ${source} e deve ser reapurada antes da publicação final.\n\nA orientação é checar fonte oficial, confirmar local, data, envolvidos e eventuais desdobramentos. Após a confirmação, o texto pode ser publicado com foco no impacto para a população local.\n\nFonte inicial para checagem: ${item.link}`;
  const instagram = `${siteTitle}\n\nO caso entrou no radar do O Catarina e será acompanhado com checagem de fonte oficial.\n\n#SantaCatarina #OCatarina #NoticiasSC`;
  const video = `ABERTURA: Uma pauta de ${city} começou a repercutir e merece atenção.\n\nCONTEXTO: A informação inicial veio de ${source}. Antes de cravar qualquer conclusão, é preciso checar fonte oficial e confirmar os detalhes.\n\nFECHAMENTO: O Catarina acompanha o caso e atualiza assim que houver confirmação.`;
  return { siteTitle, supportLine, body, instagram, video };
}

export default async function DraftPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const newsId = typeof params.newsId === 'string' ? params.newsId : undefined;

  if (!newsId) {
    return (
      <main className="mx-auto max-w-5xl px-6 py-8">
        <h2 className="text-3xl font-black">Gerador de base editorial</h2>
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
    <main className="mx-auto max-w-5xl px-6 py-8">
      <section className="rounded-3xl bg-zinc-950 p-8 text-white shadow-sm">
        <p className="text-sm font-bold uppercase tracking-[0.25em] text-zinc-400">Base editorial</p>
        <h2 className="mt-3 text-4xl font-black leading-tight">Texto-base para reapuração.</h2>
        <p className="mt-4 max-w-3xl text-zinc-300">Use como rascunho, não como cópia automática. Antes de publicar, confirme fonte oficial e ajuste o ângulo do O Catarina.</p>
      </section>

      <DraftCopyPanel draft={draft} />
    </main>
  );
}
