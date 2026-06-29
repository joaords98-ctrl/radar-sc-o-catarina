import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import type { NewsItem } from '@/lib/types';
import { DraftCopyPanel } from '@/components/CopyBlock';
import { buildInstagramDraftForItem } from '@/lib/instagram';
import { formatBrazilDateTimeWithZone } from '@/lib/date';

export const dynamic = 'force-dynamic';

function cleanText(value: string | null | undefined) {
  return (value ?? '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

function truncate(value: string, limit: number) {
  const clean = cleanText(value);
  if (clean.length <= limit) return clean;
  return `${clean.slice(0, limit - 3).trim()}...`;
}

function sentence(value: string) {
  const clean = cleanText(value);
  if (!clean) return '';
  return /[.!?…]$/.test(clean) ? clean : `${clean}.`;
}

function sourceLabel(item: NewsItem) {
  return cleanText(item.source_name) || cleanText(item.source_domain) || 'fonte inicial';
}

function placeLabel(item: NewsItem) {
  return cleanText(item.city) || cleanText(item.region) || 'Santa Catarina';
}

function topicLabel(item: NewsItem) {
  return cleanText(item.topic) || 'notícia';
}

function buildSupportLine(item: NewsItem, title: string, summary: string, source: string, place: string) {
  if (summary) return truncate(summary, 145);
  return truncate(`Caso em ${place} foi localizado pelo Radar a partir de publicação de ${source}.`, 145);
}

function buildSiteBody(item: NewsItem, title: string, summary: string, source: string, place: string, topic: string) {
  const published = item.published_at ? formatBrazilDateTimeWithZone(item.published_at) : 'data não informada';
  const angle = cleanText(item.angle);
  const notes = cleanText(item.notes);
  const hasSensitiveTopic = /escândalo|denúncia|corrupção|fraude|investiga|licitação|dinheiro público/i.test(`${topic} ${title} ${summary}`);

  const lead = summary
    ? `**${place}** entrou no radar editorial do **O Catarina** após publicação de **${source}** sobre **${title}**. Segundo a fonte inicial, ${sentence(summary)}`
    : `**${place}** entrou no radar editorial do **O Catarina** após publicação de **${source}** sobre **${title}**. A informação ainda depende de complementação pela redação antes da publicação final.`;

  const context = `A pauta foi classificada pelo Radar como tema de **${topic}** e foi capturada em **${published}**.`;
  const angleBlock = angle ? `\n\nO ângulo sugerido para a cobertura é: **${sentence(angle)}**` : '';
  const notesBlock = notes ? `\n\nA apuração inicial também registrou a seguinte observação: **${sentence(notes)}**` : '';
  const sensitiveBlock = hasSensitiveTopic
    ? `\n\nPor se tratar de assunto sensível, a publicação deve manter linguagem cautelosa, tratando o caso como **suspeita, denúncia ou investigação**, conforme a documentação disponível e a manifestação das partes citadas.`
    : '';
  const repercussion = item.media_mentions_count && item.media_mentions_count > 1
    ? `\n\nO Radar identificou repercussão do tema em **${item.media_mentions_count}** menções/fontes monitoradas${item.top_media_sources?.length ? `, incluindo **${item.top_media_sources.slice(0, 4).join(', ')}**` : ''}.`
    : '';

  return `${lead}\n\n${context}${angleBlock}${repercussion}${notesBlock}${sensitiveBlock}\n\nO **O Catarina** acompanha o caso e pode atualizar a matéria conforme novas informações oficiais forem divulgadas.`;
}

function buildChecklist(item: NewsItem, source: string, place: string) {
  return [
    `Fonte inicial: ${source}`,
    `Link: ${item.link}`,
    `Cidade/região: ${place}`,
    '',
    'Antes de publicar, confirmar:',
    `- local exato em ${place}`,
    '- data e horário do fato',
    '- fonte oficial ou documento-base',
    '- nomes, cargos e grafia correta dos envolvidos',
    '- defesa/manifestação dos citados quando houver acusação ou suspeita',
    '- se há atualização, nota oficial, boletim, decisão ou procedimento formal',
  ].join('\n');
}

function buildInstagramFromNews(item: NewsItem, title: string, summary: string, place: string, source: string) {
  const base = buildInstagramDraftForItem(item);
  const hook = truncate(title, 120);
  const detail = summary
    ? truncate(summary, 220)
    : `A pauta foi localizada a partir de ${source} e precisa de checagem antes da publicação final.`;

  const caption = `${hook}\n\n${detail}\n\nO caso entrou no radar do O Catarina em ${place}. Acompanhe a apuração e os desdobramentos.\n\n${base.caption.split('\n').pop()}`;
  const reels = `ABERTURA: ${hook}\n\nCONTEXTO: ${detail}\n\nCHECAGEM: confirmar local, data, fonte oficial e novos desdobramentos.\n\nFECHAMENTO: O Catarina acompanha e atualiza assim que houver novas informações.`;

  return { ...base, caption, reels };
}

function buildDraft(item: NewsItem) {
  const title = cleanText(item.title) || 'Pauta sem título';
  const summary = cleanText(item.summary);
  const source = sourceLabel(item);
  const place = placeLabel(item);
  const topic = topicLabel(item);
  const siteTitle = truncate(title, 105);
  const supportLine = buildSupportLine(item, title, summary, source, place);
  const body = buildSiteBody(item, title, summary, source, place, topic);
  const checklist = buildChecklist(item, source, place);
  const instagramDraft = buildInstagramFromNews(item, title, summary, place, source);

  return {
    siteTitle,
    supportLine,
    body,
    checklist,
    instagram: instagramDraft.caption,
    video: instagramDraft.reels,
    sourceUrl: item.link,
    category: topic,
    city: place,
  };
}

export default async function DraftPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const newsId = typeof params.newsId === 'string' ? params.newsId : undefined;

  if (!newsId) {
    return (
      <main className="mx-auto max-w-5xl px-4 py-5 sm:px-6 sm:py-8">
        <h2 className="text-2xl font-black sm:text-3xl">Gerador de matéria para site</h2>
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
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-zinc-400 sm:text-sm sm:tracking-[0.25em]">Base editorial v14</p>
        <h2 className="mt-3 text-2xl font-black leading-tight sm:text-4xl">Matéria pronta para o site, com checklist separado.</h2>
        <p className="mt-4 max-w-3xl text-sm leading-6 text-zinc-300 sm:text-base">
          A versão de publicação sai limpa. A orientação de checagem fica em bloco interno para evitar publicar instrução editorial por acidente.
        </p>
      </section>

      <DraftCopyPanel draft={draft} />
    </main>
  );
}
