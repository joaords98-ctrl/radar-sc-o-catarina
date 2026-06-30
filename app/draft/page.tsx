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

type SourceContext = {
  url: string;
  title: string;
  description: string;
  paragraphs: string[];
  fetched: boolean;
};

function decodeHtml(value: string) {
  return value
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}

function stripHtml(value: string) {
  return cleanText(decodeHtml(value.replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<style[\s\S]*?<\/style>/gi, ' ')));
}

function metaContent(html: string, patterns: RegExp[]) {
  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match?.[1]) return stripHtml(match[1]);
  }
  return '';
}

function extractSourceContext(html: string, url: string): SourceContext {
  const title = metaContent(html, [
    /<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["'][^>]*>/i,
    /<meta[^>]+name=["']twitter:title["'][^>]+content=["']([^"']+)["'][^>]*>/i,
    /<title[^>]*>([\s\S]*?)<\/title>/i,
  ]);
  const description = metaContent(html, [
    /<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)["'][^>]*>/i,
    /<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["'][^>]*>/i,
    /<meta[^>]+name=["']twitter:description["'][^>]+content=["']([^"']+)["'][^>]*>/i,
  ]);
  const paragraphMatches = Array.from(html.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi));
  const paragraphs = paragraphMatches
    .map((match) => stripHtml(match[1]))
    .filter((text) => text.length >= 70)
    .filter((text) => !/cookies|newsletter|publicidade|assine|compartilhe|whatsapp|instagram|facebook|leia tamb[eé]m/i.test(text))
    .slice(0, 5);

  return { url, title, description, paragraphs, fetched: Boolean(title || description || paragraphs.length) };
}

async function fetchSourceContext(url: string): Promise<SourceContext | null> {
  if (!/^https?:\/\//i.test(url)) return null;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 6500);

  try {
    const response = await fetch(url, {
      redirect: 'follow',
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; RadarSC/1.0; +https://ocatarina.com.br)',
        Accept: 'text/html,application/xhtml+xml',
      },
      next: { revalidate: 600 },
    });

    const contentType = response.headers.get('content-type') ?? '';
    if (!response.ok || !contentType.includes('text/html')) return null;

    const html = await response.text();
    const context = extractSourceContext(html, response.url || url);
    return context.fetched ? context : null;
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
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

const categories = [
  'Segurança Pública',
  'Política',
  'Gestão Pública',
  'Justiça',
  'Trânsito/Rodovias',
  'Radar Estadual',
  'Causa Animal',
  'Infância e Adolescência',
  'Assistência Social',
  'Economia',
  'Escândalos/Denúncias',
] as const;

function inferCategory(item: NewsItem, title: string, summary: string, topic: string) {
  const haystack = `${title} ${summary} ${topic} ${item.query_label ?? ''} ${item.angle ?? ''}`.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

  if (/escandalo|denuncia|fraude|corrupcao|superfaturamento|improbidade|rachadinha|nepotismo|contrato suspeito/.test(haystack)) return 'Escândalos/Denúncias';
  if (/policia|prisao|preso|homicidio|assalto|roubo|furto|trafico|arma|operacao policial|delegacia|pm|pcsc/.test(haystack)) return 'Segurança Pública';
  if (/justica|tjsc|mpsc|ministerio publico|processo|condenacao|liminar|decisao judicial|acao civil/.test(haystack)) return 'Justiça';
  if (/prefeitura|camara|vereador|prefeito|governo|secretaria|servidor|licitacao|contrato publico|tce/.test(haystack)) return 'Gestão Pública';
  if (/deputado|senador|governador|eleicao|partido|politica|assembleia legislativa|alesc/.test(haystack)) return 'Política';
  if (/rodovia|br-|sc-|prf|transito|acidente|colisao|atropelamento|bloqueio|fila|interdicao/.test(haystack)) return 'Trânsito/Rodovias';
  if (/animal|cao|gato|maus-tratos|maus tratos|resgate animal|causa animal/.test(haystack)) return 'Causa Animal';
  if (/crianca|adolescente|menor|escola|creche|conselho tutelar|infancia/.test(haystack)) return 'Infância e Adolescência';
  if (/assistencia social|morador de rua|vulnerabilidade|abrigo|cras|beneficio social/.test(haystack)) return 'Assistência Social';
  if (/economia|empresa|emprego|industria|comercio|preco|investimento|mercado|turismo/.test(haystack)) return 'Economia';
  if (categories.includes(topic as typeof categories[number])) return topic;
  return 'Radar Estadual';
}

function isSensitiveCase(title: string, summary: string, topic: string) {
  return /escândalo|escandalo|denúncia|denuncia|acusação|acusacao|corrupção|corrupcao|fraude|investiga|operação|operacao|licitação|licitacao|improbidade|crime|prisão|prisao|suspeito/i.test(`${topic} ${title} ${summary}`);
}

function isWeakSummary(summary: string, title: string, source: string) {
  const cleanSummary = cleanText(summary).toLowerCase();
  const cleanTitle = cleanText(title).toLowerCase();
  const cleanSource = cleanText(source).toLowerCase();

  if (!cleanSummary) return true;
  if (/^https?:\/\//i.test(cleanSummary)) return true;
  if (cleanSummary === cleanTitle) return true;
  if (cleanSummary.replace(cleanSource, '').trim() === cleanTitle) return true;
  if (cleanSummary.includes(cleanTitle) && cleanSummary.includes(cleanSource) && cleanSummary.length <= cleanTitle.length + cleanSource.length + 30) return true;
  return false;
}

function sourceSummary(summary: string, sourceContext: SourceContext | null, title = '', source = '') {
  const collectedSummary = cleanText(summary);
  if (collectedSummary && !isWeakSummary(collectedSummary, title, source)) return collectedSummary;

  return cleanText(sourceContext?.description) || cleanText(sourceContext?.paragraphs?.[0]);
}

function buildSupportLine(_item: NewsItem, title: string, summary: string, source: string, place: string, sourceContext: SourceContext | null) {
  const bestSummary = sourceSummary(summary, sourceContext, title, source);
  if (bestSummary) return truncate(bestSummary, 145);
  return truncate(`Pauta em apuração sobre ${title} em ${place}.`, 145);
}

function buildSiteBody(item: NewsItem, title: string, summary: string, source: string, place: string, category: string, sourceContext: SourceContext | null) {
  const published = item.published_at ? formatBrazilDateTimeWithZone(item.published_at) : 'data não informada';
  const angle = cleanText(item.angle);
  const notes = cleanText(item.notes);
  const bestSummary = sourceSummary(summary, sourceContext, title, source);
  const sourceParagraphs = (sourceContext?.paragraphs ?? []).filter((paragraph) => paragraph !== bestSummary).slice(0, 3);
  const hasSensitiveTopic = isSensitiveCase(title, bestSummary, category);

  if (!bestSummary && !sourceParagraphs.length) {
    const angleBlock = angle ? `\n\n**Linha de apuração sugerida:** ${sentence(angle)}` : '';
    return `**${place}** — A pauta **${title}** foi identificada pelo **Radar do O Catarina**, mas o sistema ainda não conseguiu puxar conteúdo suficiente da matéria original para transformar o caso em notícia pronta.\n\nA pauta está classificada como **${category}** e foi capturada em **${published}**.${angleBlock}\n\nAntes de publicar, a redação precisa confirmar **o fato principal**, **valores**, **datas**, **órgãos envolvidos**, **responsáveis citados**, **documentos oficiais** e **eventuais manifestações das partes**.\n\nPor enquanto, este rascunho deve ser tratado como **pauta em apuração**, não como matéria final.`;
  }

  const lead = bestSummary
    ? `**${place}** — ${sentence(bestSummary)} A informação foi localizada pelo **Radar do O Catarina** a partir de publicação de **${source}**.`
    : `**${place}** — O **Radar do O Catarina** identificou uma pauta sobre **${title}** a partir de publicação de **${source}**. A informação ainda depende de complementação pela redação antes da publicação final.`;

  const context = `A pauta foi classificada na categoria **${category}** e foi capturada em **${published}**.`;
  const sourceDetails = sourceParagraphs.length
    ? `\n\nSegundo as informações coletadas na fonte inicial, ${sourceParagraphs.map(sentence).join(' ')}`
    : '';
  const angleBlock = angle ? `\n\nO ângulo sugerido para a cobertura é: **${sentence(angle)}**` : '';
  const notesBlock = notes ? `\n\nA apuração inicial também registrou a seguinte observação: **${sentence(notes)}**` : '';
  const sensitiveBlock = hasSensitiveTopic
    ? `\n\nPor se tratar de assunto sensível, o texto deve diferenciar **fato confirmado**, **suspeita**, **denúncia**, **investigação** ou **acusação**, sem apontar culpa ou condenação antes de confirmação oficial. Caso haja citados, a posição deles deve ser incluída quando disponível.`
    : '';
  const repercussion = item.media_mentions_count && item.media_mentions_count > 1
    ? `\n\nO Radar identificou repercussão do tema em **${item.media_mentions_count}** menções/fontes monitoradas${item.top_media_sources?.length ? `, incluindo **${item.top_media_sources.slice(0, 4).join(', ')}**` : ''}.`
    : '';

  return `${lead}\n\n${context}${sourceDetails}${angleBlock}${repercussion}${notesBlock}${sensitiveBlock}\n\nO **O Catarina** acompanha o caso e pode atualizar a matéria conforme novas informações oficiais, documentos ou manifestações forem divulgados.`;
}

function buildChecklist(item: NewsItem, source: string, place: string, category: string, title: string, summary: string, sourceContext: SourceContext | null) {
  const hasSummary = Boolean(sourceSummary(summary, sourceContext, title, source));
  const sensitive = isSensitiveCase(title, summary, category);
  return [
    `Categoria sugerida: ${category}`,
    `Fonte inicial: ${source}`,
    `Link: ${item.link}`,
    `Conteúdo da fonte puxado: ${sourceContext?.fetched ? 'sim' : 'não; revisar link original antes de publicar'}`,
    sourceContext?.url && sourceContext.url !== item.link ? `URL final identificada: ${sourceContext.url}` : null,
    `Cidade/região: ${place}`,
    `Informações suficientes: ${hasSummary ? 'parciais, revisar fonte original antes de publicar' : 'não, falta resumo/contexto da fonte original'}`,
    `Natureza do caso: ${sensitive ? 'sensível; separar fato confirmado de suspeita/denúncia/investigação/acusação' : 'factual; confirmar dados básicos antes de publicar'}`,
    '',
    'Antes de publicar, confirmar:',
    `- local exato em ${place}`,
    '- data e horário do fato',
    '- fonte oficial ou documento-base: MPSC, Polícia Civil, Polícia Militar, TJSC, Prefeitura, Defesa Civil, Corpo de Bombeiros, PRF, TCE/SC ou órgão responsável',
    '- nomes, cargos e grafia correta dos envolvidos',
    '- defesa/manifestação dos citados quando houver acusação ou suspeita',
    '- preservação de vítimas, crianças, adolescentes e pessoas vulneráveis',
    '- se há atualização, nota oficial, boletim, decisão ou procedimento formal',
  ].filter(Boolean).join('\n');
}

function buildInstagramFromNews(item: NewsItem, title: string, summary: string, place: string, source: string, category: string, sourceContext: SourceContext | null) {
  const base = buildInstagramDraftForItem(item);
  const hook = truncate(title, 120);
  const bestSummary = sourceSummary(summary, sourceContext, title, source);
  const detail = bestSummary
    ? truncate(bestSummary, 220)
    : `A pauta foi localizada a partir de ${source} e precisa de checagem antes da publicação final.`;

  const caution = isSensitiveCase(title, summary, category)
    ? '\n\nO caso deve ser tratado como suspeita, denúncia ou investigação até confirmação oficial.'
    : '';
  const caption = `${hook}\n\n${detail}${caution}\n\nO caso entrou no radar do O Catarina em ${place}. Acompanhe a apuração e os desdobramentos.\n\n${base.caption.split('\n').pop()}`;
  const reels = `ABERTURA: ${hook}\n\nCONTEXTO: ${detail}\n\nCHECAGEM: confirmar local, data, fonte oficial e novos desdobramentos.\n\nFECHAMENTO: O Catarina acompanha e atualiza assim que houver novas informações.`;

  return { ...base, caption, reels };
}

async function buildDraft(item: NewsItem) {
  const title = cleanText(item.title) || 'Pauta sem título';
  const sourceContext = await fetchSourceContext(item.link);
  const source = sourceLabel(item);
  const summary = sourceSummary(cleanText(item.summary), sourceContext, title, source);
  const place = placeLabel(item);
  const topic = topicLabel(item);
  const category = inferCategory(item, title, summary, topic);
  const siteTitle = truncate(title, 105);
  const supportLine = buildSupportLine(item, title, summary, source, place, sourceContext);
  const body = buildSiteBody(item, title, summary, source, place, category, sourceContext);
  const checklist = buildChecklist(item, source, place, category, title, summary, sourceContext);
  const instagramDraft = buildInstagramFromNews(item, title, summary, place, source, category, sourceContext);

  return {
    siteTitle,
    supportLine,
    body,
    checklist,
    instagram: instagramDraft.caption,
    video: instagramDraft.reels,
    sourceUrl: item.link,
    category,
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
  const draft = await buildDraft(item);

  return (
    <main className="mx-auto max-w-5xl px-4 py-5 sm:px-6 sm:py-8">
      <section className="rounded-2xl bg-zinc-950 p-5 text-white shadow-sm sm:rounded-3xl sm:p-8">
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-zinc-400 sm:text-sm sm:tracking-[0.25em]">Base editorial v14.15</p>
        <h2 className="mt-3 text-2xl font-black leading-tight sm:text-4xl">Redação no padrão do O Catarina.</h2>
        <p className="mt-4 max-w-3xl text-sm leading-6 text-zinc-300 sm:text-base">
          A matéria separa categoria, texto para site, checagem interna e Instagram. Casos sensíveis ficam com linguagem juridicamente segura.
        </p>
      </section>

      <DraftCopyPanel draft={draft} />
    </main>
  );
}
