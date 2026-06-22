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
  if (summary) return truncate(summary, 150);
  return truncate(`Informação localizada em ${source} coloca ${place} no radar com a pauta: ${title}`, 150);
}

function buildBody(item: NewsItem, title: string, summary: string, source: string, place: string, topic: string) {
  const published = item.published_at ? formatBrazilDateTimeWithZone(item.published_at) : 'data não informada';
  const angle = cleanText(item.angle);
  const notes = cleanText(item.notes);
  const repercussion = item.media_mentions_count && item.media_mentions_count > 1
    ? `\n\n**Repercussão identificada pelo Radar:** o assunto apareceu em **${item.media_mentions_count}** menções/fontes monitoradas${item.top_media_sources?.length ? `, incluindo **${item.top_media_sources.slice(0, 4).join(', ')}**` : ''}.`
    : '';

  const summaryBlock = summary
    ? `\n\n**Resumo coletado:** ${sentence(summary)}`
    : `\n\n**Resumo coletado:** o feed não trouxe descrição completa. A base deve partir da chamada original e da checagem no link da fonte.`;

  const angleBlock = angle ? `\n\n**Ângulo sugerido:** ${sentence(angle)}` : '';
  const notesBlock = notes ? `\n\n**Observação interna:** ${sentence(notes)}` : '';

  return `**${place}** — O Radar do **O Catarina** identificou uma pauta publicada por **${source}** com o seguinte destaque: **${title}**.${summaryBlock}\n\nPela classificação do Radar, o assunto envolve **${topic}** e tem relação com **${place}**. A publicação foi capturada em **${published}**.${angleBlock}${repercussion}${notesBlock}\n\nAntes da publicação final, a redação deve confirmar **local exato, data, fonte oficial, envolvidos e desdobramentos**. Se houver órgão público, prefeitura, polícia, Defesa Civil, concessionária ou assessoria citada na fonte original, a checagem deve priorizar esses canais.\n\n**Fonte inicial para checagem:** ${item.link}\n\n**Checklist rápido de apuração:**\n- Confirmar se o fato ocorreu em **${place}**.\n- Verificar data e horário do acontecimento.\n- Checar se há nota oficial, boletim, vídeo, foto ou atualização.\n- Ajustar o texto final com dados confirmados e sem extrapolar o que a fonte informa.`;
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
  const body = buildBody(item, title, summary, source, place, topic);
  const instagramDraft = buildInstagramFromNews(item, title, summary, place, source);

  return {
    siteTitle,
    supportLine,
    body,
    instagram: instagramDraft.caption,
    video: instagramDraft.reels,
  };
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
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-zinc-400 sm:text-sm sm:tracking-[0.25em]">Base editorial v13.9</p>
        <h2 className="mt-3 text-2xl font-black leading-tight sm:text-4xl">Texto-base com foco na notícia selecionada.</h2>
        <p className="mt-4 max-w-3xl text-sm leading-6 text-zinc-300 sm:text-base">Agora a base usa título, resumo, fonte, cidade, data e ângulo da notícia. Continue checando a fonte original antes de publicar.</p>
      </section>

      <DraftCopyPanel draft={draft} />
    </main>
  );
}
