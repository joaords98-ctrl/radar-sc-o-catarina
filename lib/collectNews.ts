import Parser from 'rss-parser';
import { getSupabaseAdmin } from './supabaseAdmin';
import { buildGoogleNewsRssUrl, normalizeExternalId, splitGoogleNewsTitle } from './googleNews';
import { inferAngle, scoreNews } from './scoring';
import { classifySantaCatarinaNews } from './scGeo';
import { buildStoryKey, refreshRepercussionMetrics, sourceDomainFromUrl } from './repercussion';
import { getRecentCutoffIso, getRecentHours, isRecentPublishedAt } from './recent';
import type { RssQuery } from './types';

type CollectMode = 'quick' | 'scheduled' | 'full';

type CollectOptions = {
  mode?: CollectMode;
};

const parser = new Parser();

const MODE_SETTINGS: Record<CollectMode, {
  queryLimit: number;
  itemLimit: number;
  feedTimeoutMs: number;
  deadlineMs: number;
  refreshRepercussion: boolean;
}> = {
  quick: {
    queryLimit: 24,
    itemLimit: 6,
    feedTimeoutMs: 3500,
    deadlineMs: 35_000,
    refreshRepercussion: false,
  },
  scheduled: {
    queryLimit: 70,
    itemLimit: 8,
    feedTimeoutMs: 4500,
    deadlineMs: 52_000,
    refreshRepercussion: true,
  },
  full: {
    queryLimit: 110,
    itemLimit: 10,
    feedTimeoutMs: 5000,
    deadlineMs: 55_000,
    refreshRepercussion: true,
  },
};

const SCANDAL_QUERIES: RssQuery[] = [
  { id: 'auto-escandalos-1', label: 'Escândalos SC · denúncias e investigações', query: 'denúncia OR investigação OR irregularidade prefeitura Santa Catarina', topic: 'Escândalos/Denúncias', city: null, region: null, priority_weight: 120, enabled: true },
  { id: 'auto-escandalos-2', label: 'Escândalos SC · TCE-SC', query: 'TCE SC irregularidade prefeitura contrato licitação', topic: 'Escândalos/Denúncias', city: null, region: null, priority_weight: 118, enabled: true },
  { id: 'auto-escandalos-3', label: 'Escândalos SC · MPSC', query: 'MPSC investigação prefeitura vereador servidor Santa Catarina', topic: 'Escândalos/Denúncias', city: null, region: null, priority_weight: 118, enabled: true },
  { id: 'auto-escandalos-4', label: 'Escândalos SC · Gaeco', query: 'Gaeco operação prefeitura câmara vereador Santa Catarina', topic: 'Escândalos/Denúncias', city: null, region: null, priority_weight: 118, enabled: true },
  { id: 'auto-escandalos-5', label: 'Escândalos SC · licitações e contratos', query: 'fraude licitação superfaturamento contrato Santa Catarina', topic: 'Escândalos/Denúncias', city: null, region: null, priority_weight: 116, enabled: true },
  { id: 'auto-escandalos-6', label: 'Escândalos SC · improbidade', query: 'improbidade administrativa prefeito vereador Santa Catarina', topic: 'Escândalos/Denúncias', city: null, region: null, priority_weight: 114, enabled: true },
  { id: 'auto-escandalos-7', label: 'Escândalos SC · dinheiro público', query: 'desvio dinheiro público saúde educação obra Santa Catarina', topic: 'Dinheiro Público', city: null, region: null, priority_weight: 113, enabled: true },
  { id: 'auto-escandalos-8', label: 'Escândalos SC · ação civil pública', query: 'ação civil pública prefeitura Santa Catarina Ministério Público', topic: 'Escândalos/Denúncias', city: null, region: null, priority_weight: 112, enabled: true },
  { id: 'auto-escandalos-9', label: 'Escândalos SC · nepotismo', query: 'nepotismo prefeitura câmara vereador Santa Catarina', topic: 'Escândalos/Denúncias', city: null, region: null, priority_weight: 110, enabled: true },
  { id: 'auto-escandalos-10', label: 'Escândalos SC · câmaras municipais', query: 'CPI Câmara vereadores Santa Catarina irregularidade denúncia', topic: 'Escândalos/Denúncias', city: null, region: null, priority_weight: 108, enabled: true },
];

function mergeScandalQueries(mode: CollectMode, queries: RssQuery[], limit: number) {
  if (mode !== 'scheduled' && mode !== 'full') {
    return queries.slice(0, limit);
  }

  const seen = new Set<string>();
  const merged = [...SCANDAL_QUERIES, ...queries]
    .filter((query) => {
      const key = `${query.query}|${query.label}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .sort((a, b) => (b.priority_weight ?? 0) - (a.priority_weight ?? 0));

  return merged.slice(0, limit);
}

async function parseFeedWithTimeout(url: string, timeoutMs: number) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Radar SC O Catarina/1.0',
        Accept: 'application/rss+xml, application/xml, text/xml, */*',
      },
    });

    if (!res.ok) {
      throw new Error(`RSS retornou HTTP ${res.status}`);
    }

    const xml = await res.text();
    return parser.parseString(xml);
  } finally {
    clearTimeout(timeout);
  }
}

function isGoogleNewsUrl(url: string) {
  try {
    const host = new URL(url).hostname.replace(/^www\./, '');
    return host === 'news.google.com';
  } catch {
    return false;
  }
}

function cleanHtml(value: string) {
  return value
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}


function normalizeForChecks(value: string | null | undefined) {
  return (value ?? '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();
}

function isGoogleNewsPlaceholder(value: string | null | undefined) {
  const text = normalizeForChecks(value);
  if (!text) return false;
  return /comprehensive up-to-date news coverage/.test(text)
    || /aggregated from sources all over the world by google news/.test(text)
    || /^google news$/.test(text)
    || /^full coverage$/.test(text)
    || /^cobertura completa$/.test(text)
    || /view full coverage on google news/.test(text);
}

function isUsableEditorialText(value: string | null | undefined) {
  const text = (value ?? '').trim();
  if (!text) return false;
  if (/^https?:\/\//i.test(text)) return false;
  if (isGoogleNewsPlaceholder(text)) return false;
  if (text.replace(/\s+/g, ' ').trim().length < 45) return false;
  return true;
}


function isUsableTitle(value: string | null | undefined) {
  const text = (value ?? '').replace(/\s+/g, ' ').trim();
  if (!text) return false;
  if (/^https?:\/\//i.test(text)) return false;
  if (isGoogleNewsPlaceholder(text)) return false;
  if (text.length < 12) return false;
  return true;
}

function extractMeta(html: string, patterns: RegExp[]) {
  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match?.[1]) return cleanHtml(match[1]);
  }
  return '';
}

function extractParagraphSummary(html: string) {
  const paragraphs = Array.from(html.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi))
    .map((match) => cleanHtml(match[1]))
    .filter((text) => text.length >= 90)
    .filter((text) => isUsableEditorialText(text))
    .filter((text) => !/cookies|newsletter|publicidade|assine|compartilhe|whatsapp|instagram|facebook|leia tamb[eé]m/i.test(text));
  return paragraphs.slice(0, 2).join(' ');
}

function firstExternalUrlFromHtml(html: string) {
  const urls = Array.from(html.matchAll(/https?:\/\/[^"'<>\s)]+/gi))
    .map((match) => match[0].replace(/\\u003d/g, '=').replace(/\\u0026/g, '&'))
    .filter((url) => {
      try {
        const host = new URL(url).hostname.replace(/^www\./, '');
        return host !== 'news.google.com' && host !== 'google.com' && !host.endsWith('.google.com') && !host.includes('gstatic') && !host.includes('googleusercontent');
      } catch {
        return false;
      }
    });
  return urls[0] ?? null;
}

async function fetchArticleMetadata(url: string, timeoutMs: number) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      redirect: 'follow',
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; RadarSC/1.0; +https://ocatarina.com.br)',
        Accept: 'text/html,application/xhtml+xml',
      },
    });

    const contentType = response.headers.get('content-type') ?? '';
    if (!response.ok || !contentType.includes('text/html')) return null;

    const html = await response.text();
    const description = extractMeta(html, [
      /<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)["'][^>]*>/i,
      /<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["'][^>]*>/i,
      /<meta[^>]+name=["']twitter:description["'][^>]+content=["']([^"']+)["'][^>]*>/i,
    ]);
    const paragraphSummary = extractParagraphSummary(html);

    const summary = isUsableEditorialText(description) ? description : (isUsableEditorialText(paragraphSummary) ? paragraphSummary : null);
    return {
      finalUrl: response.url || url,
      summary,
    };
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

async function resolveArticleLink(link: string, timeoutMs: number) {
  if (!isGoogleNewsUrl(link)) return link;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(link, {
      redirect: 'manual',
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; RadarSC/1.0; +https://ocatarina.com.br)',
        Accept: 'text/html,application/xhtml+xml',
      },
    });

    const location = response.headers.get('location');
    if (location) {
      const redirected = new URL(location, link).toString();
      if (!isGoogleNewsUrl(redirected)) return redirected;
    }

    const html = await response.text().catch(() => '');
    const externalUrl = firstExternalUrlFromHtml(html);
    if (externalUrl) return externalUrl;
  } catch {
    return link;
  } finally {
    clearTimeout(timeout);
  }

  return link;
}

function isDeadlineReached(deadlineAt: number) {
  return Date.now() >= deadlineAt;
}

export async function collectNews(options: CollectOptions = {}) {
  const mode = options.mode ?? 'quick';
  const settings = MODE_SETTINGS[mode] ?? MODE_SETTINGS.quick;
  const deadlineAt = Date.now() + settings.deadlineMs;

  const supabase = getSupabaseAdmin();
  const recentHours = getRecentHours();
  const cutoffIso = getRecentCutoffIso(recentHours);

  const { data: queries, error } = await supabase
    .from('rss_queries')
    .select('*')
    .eq('enabled', true)
    .order('priority_weight', { ascending: false })
    .limit(settings.queryLimit);

  if (error) throw error;

  let inserted = 0;
  let updated = 0;
  let skipped = 0;
  let skippedOld = 0;
  let skippedWithoutDate = 0;
  let skippedOutOfState = 0;
  let skippedNoScContext = 0;
  let processedQueries = 0;
  let stoppedByDeadline = false;
  const errors: string[] = [];

  const queryList = mergeScandalQueries(mode, (queries ?? []) as RssQuery[], settings.queryLimit);

  for (const query of queryList) {
    if (isDeadlineReached(deadlineAt)) {
      stoppedByDeadline = true;
      break;
    }

    processedQueries += 1;

    try {
      const feed = await parseFeedWithTimeout(buildGoogleNewsRssUrl(query.query), settings.feedTimeoutMs);
      const items = feed.items.slice(0, settings.itemLimit);

      for (const item of items) {
        if (isDeadlineReached(deadlineAt)) {
          stoppedByDeadline = true;
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

        if (!isRecentPublishedAt(publishedAt, recentHours)) {
          skippedOld += 1;
          skipped += 1;
          continue;
        }

        const { cleanTitle, sourceName } = splitGoogleNewsTitle(item.title);
        if (!isUsableTitle(cleanTitle)) {
          skipped += 1;
          continue;
        }

        const resolvedLink = await resolveArticleLink(item.link, Math.min(2200, settings.feedTimeoutMs));
        const metadata = !isGoogleNewsUrl(resolvedLink) && Date.now() < deadlineAt - 4000
          ? await fetchArticleMetadata(resolvedLink, Math.min(2600, settings.feedTimeoutMs))
          : null;
        const articleLink = metadata?.finalUrl ?? resolvedLink;
        const sourceDomain = sourceDomainFromUrl(articleLink);
        const initialSummary = item.contentSnippet ?? item.content ?? null;
        const enrichedSummary = metadata?.summary ?? (isUsableEditorialText(initialSummary) ? initialSummary : null);
        const externalId = normalizeExternalId(articleLink || item.link);
        const scMatch = classifySantaCatarinaNews({
          title: cleanTitle,
          summary: enrichedSummary,
          sourceName: sourceName ?? item.creator ?? feed.title ?? 'Google News',
          sourceDomain,
          queryCity: query.city,
          queryRegion: query.region,
        });

        if (!scMatch.allowed) {
          skipped += 1;
          if (scMatch.reason === 'fora_de_sc') skippedOutOfState += 1;
          else skippedNoScContext += 1;
          continue;
        }

        const storyKey = buildStoryKey(cleanTitle);
        const detectedCity = scMatch.city ?? query.city ?? null;
        const detectedRegion = scMatch.region ?? query.region ?? null;
        const score = scoreNews({
          title: cleanTitle,
          summary: enrichedSummary ?? undefined,
          queryWeight: query.priority_weight,
          publishedAt,
        });

        const { data: existing } = await supabase
          .from('news_items')
          .select('id')
          .eq('external_id', externalId)
          .maybeSingle();

        const { error: insertError } = await supabase.from('news_items').upsert(
          {
            external_id: externalId,
            title: cleanTitle,
            link: articleLink,
            source_name: sourceName ?? item.creator ?? feed.title ?? 'Google News',
            source_url: item.link,
            source_domain: sourceDomain,
            story_key: storyKey,
            published_at: new Date(publishedAt).toISOString(),
            summary: enrichedSummary,
            query_label: query.label,
            topic: query.topic,
            city: detectedCity,
            region: detectedRegion,
            opportunity_score: score,
            angle: inferAngle(cleanTitle, query.topic, detectedCity),
            status: 'novo',
          },
          { onConflict: 'external_id', ignoreDuplicates: false },
        );

        if (insertError) {
          errors.push(`${query.label}: ${insertError.message}`);
        } else if (existing?.id) {
          updated += 1;
        } else {
          inserted += 1;
        }
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      errors.push(`${query.label}: ${message}`);
    }
  }

  let repercussion = { storyGroups: 0, repercussionRowsUpdated: 0 };
  if (settings.refreshRepercussion && !stoppedByDeadline && Date.now() < deadlineAt - 8000) {
    try {
      repercussion = await refreshRepercussionMetrics(supabase, { sinceIso: cutoffIso });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      errors.push(`Repercussão: ${message}`);
    }
  }

  await supabase.from('cron_runs').insert({
    job_name: `collect-news-${mode}`,
    inserted_count: inserted,
    skipped_count: skipped,
    error_count: errors.length,
    errors,
  });

  return {
    mode,
    inserted,
    updated,
    skipped,
    skippedOld,
    skippedWithoutDate,
    skippedOutOfState,
    skippedNoScContext,
    processedQueries,
    queryLimit: settings.queryLimit,
    stoppedByDeadline,
    recentHours,
    cutoffIso,
    errors,
    ...repercussion,
  };
}
