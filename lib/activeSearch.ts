import Parser from 'rss-parser';
import { getSupabaseAdmin } from './supabaseAdmin';
import { buildGoogleNewsRssUrl, normalizeExternalId, splitGoogleNewsTitle } from './googleNews';
import { inferAngle, scoreNews } from './scoring';
import { classifySantaCatarinaNews } from './scGeo';
import { buildStoryKey, sourceDomainFromUrl } from './repercussion';

const parser = new Parser();

function normalize(input: string) {
  return input.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

function hasScContext(query: string) {
  const text = normalize(query);
  return /\bsc\b/.test(text) ||
    text.includes('santa catarina') ||
    text.includes('catarinense') ||
    /\b(sc[-\s]?\d{2,3}|br[-\s]?(101|282|470|280|116|153|163|158|285))\b/i.test(query);
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number, label: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`${label} demorou demais e foi interrompida.`)), timeoutMs);
    promise
      .then((value) => {
        clearTimeout(timer);
        resolve(value);
      })
      .catch((error) => {
        clearTimeout(timer);
        reject(error);
      });
  });
}

async function fetchGoogleNewsFeed(query: string, timeoutMs = 12000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(buildGoogleNewsRssUrl(query), {
      signal: controller.signal,
      headers: {
        'user-agent': 'Mozilla/5.0 Radar SC O Catarina',
        'accept': 'application/rss+xml, application/xml, text/xml, */*',
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new Error(`Google News respondeu ${response.status}`);
    }

    const xml = await response.text();
    return parser.parseString(xml);
  } finally {
    clearTimeout(timer);
  }
}

export function buildActiveSearchQuery(input: {
  q: string;
  city?: string | null;
  region?: string | null;
  topic?: string | null;
}) {
  const parts: string[] = [];
  const raw = input.q.trim();
  if (raw) parts.push(raw);
  if (input.city) parts.push(`"${input.city}"`);
  if (input.region) parts.push(`"${input.region}"`);
  if (input.topic && input.topic !== 'Geral') parts.push(input.topic.replace('/', ' '));
  if (!hasScContext(`${raw} ${input.city ?? ''} ${input.region ?? ''}`)) {
    parts.push('"Santa Catarina" OR SC OR catarinense');
  }
  return parts.join(' ');
}

export async function runActiveSearch(input: {
  q: string;
  city?: string | null;
  region?: string | null;
  topic?: string | null;
  hours?: number;
  limit?: number;
}) {
  const startedAt = Date.now();
  const maxRunMs = 42000;
  const supabase = getSupabaseAdmin();
  const hours = Math.max(1, Math.min(Number(input.hours || 24), 72));
  // Busca ativa precisa ser rápida. Coleta pesada fica no botão/cron próprios.
  const limit = Math.max(5, Math.min(Number(input.limit || 12), 15));
  const finalQuery = buildActiveSearchQuery(input);

  if (!input.q?.trim() && !input.city && !input.region && !input.topic) {
    throw new Error('Informe uma cidade, região, tema ou termo de busca.');
  }

  const feed = await withTimeout(fetchGoogleNewsFeed(finalQuery), 14000, 'A busca no Google News');
  const items = feed.items.slice(0, limit);

  let inserted = 0;
  let updated = 0;
  let skipped = 0;
  let skippedOld = 0;
  let skippedWithoutDate = 0;
  let skippedOutOfState = 0;
  let skippedNoScContext = 0;
  let stoppedEarly = false;
  const savedItems: Array<{
    id?: string;
    title: string;
    link: string;
    sourceName: string | null;
    sourceDomain: string | null;
    publishedAt: string;
    city: string | null;
    region: string | null;
    topic: string | null;
    score: number;
    summary: string | null;
  }> = [];

  for (const item of items) {
    if (Date.now() - startedAt > maxRunMs) {
      stoppedEarly = true;
      break;
    }

    if (!item.link || !item.title) {
      skipped += 1;
      continue;
    }

    const publishedAt = item.isoDate ?? item.pubDate ?? null;
    if (!publishedAt) {
      skippedWithoutDate += 1;
      skipped += 1;
      continue;
    }

    const externalId = normalizeExternalId(item.link);
    const { cleanTitle, sourceName } = splitGoogleNewsTitle(item.title);
    const sourceDomain = sourceDomainFromUrl(item.link);
    const scMatch = classifySantaCatarinaNews({
      title: cleanTitle,
      summary: item.contentSnippet ?? item.content ?? null,
      sourceName: sourceName ?? item.creator ?? feed.title ?? 'Google News',
      sourceDomain,
      queryCity: input.city ?? null,
      queryRegion: input.region ?? null,
    });

    if (!scMatch.allowed) {
      skipped += 1;
      if (scMatch.reason === 'fora_de_sc') skippedOutOfState += 1;
      else skippedNoScContext += 1;
      continue;
    }

    const detectedCity = scMatch.city ?? input.city ?? null;
    const detectedRegion = scMatch.region ?? input.region ?? null;
    const topic = input.topic ?? 'Busca ativa';
    const score = scoreNews({
      title: cleanTitle,
      summary: item.contentSnippet,
      queryWeight: 5,
      publishedAt,
    });

    const { data: existing } = await supabase
      .from('news_items')
      .select('id')
      .eq('external_id', externalId)
      .maybeSingle();

    const { data: saved, error } = await supabase
      .from('news_items')
      .upsert(
        {
          external_id: externalId,
          title: cleanTitle,
          link: item.link,
          source_name: sourceName ?? item.creator ?? feed.title ?? 'Google News',
          source_url: feed.link ?? null,
          source_domain: sourceDomain,
          story_key: buildStoryKey(cleanTitle),
          published_at: new Date(publishedAt).toISOString(),
          summary: item.contentSnippet ?? item.content ?? null,
          query_label: `Busca ativa: ${input.q || input.city || input.region || topic}`,
          topic,
          city: detectedCity,
          region: detectedRegion,
          opportunity_score: score,
          angle: inferAngle(cleanTitle, topic, detectedCity),
          status: existing?.id ? undefined : 'novo',
        },
        { onConflict: 'external_id', ignoreDuplicates: false },
      )
      .select('id')
      .single();

    if (error) throw error;
    if (existing?.id) updated += 1;
    else inserted += 1;

    savedItems.push({
      id: saved?.id ?? existing?.id,
      title: cleanTitle,
      link: item.link,
      sourceName: sourceName ?? item.creator ?? feed.title ?? 'Google News',
      sourceDomain,
      publishedAt: new Date(publishedAt).toISOString(),
      city: detectedCity,
      region: detectedRegion,
      topic,
      score,
      summary: item.contentSnippet ?? item.content ?? null,
    });
  }

  await supabase.from('cron_runs').insert({
    job_name: 'active-search',
    inserted_count: inserted,
    skipped_count: skipped,
    error_count: 0,
    errors: stoppedEarly ? ['Busca interrompida antes do limite da Vercel.'] : [],
  }).catch(() => null);

  return {
    finalQuery,
    inserted,
    updated,
    skipped,
    skippedOld,
    skippedWithoutDate,
    skippedOutOfState,
    skippedNoScContext,
    stoppedEarly,
    hours,
    items: savedItems,
  };
}
