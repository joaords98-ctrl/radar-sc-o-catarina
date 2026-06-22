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
  // Botão do painel: precisa terminar rápido para não travar a interface.
  quick: {
    queryLimit: 24,
    itemLimit: 6,
    feedTimeoutMs: 3500,
    deadlineMs: 35_000,
    refreshRepercussion: false,
  },
  // Cron diário: pode procurar um pouco mais, mas ainda respeita limite da Vercel Hobby.
  scheduled: {
    queryLimit: 70,
    itemLimit: 8,
    feedTimeoutMs: 4500,
    deadlineMs: 52_000,
    refreshRepercussion: true,
  },
  // Uso manual avançado, se chamado com ?mode=full.
  full: {
    queryLimit: 110,
    itemLimit: 10,
    feedTimeoutMs: 5000,
    deadlineMs: 55_000,
    refreshRepercussion: true,
  },
};

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

  for (const query of (queries ?? []) as RssQuery[]) {
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

        const externalId = normalizeExternalId(item.link);
        const { cleanTitle, sourceName } = splitGoogleNewsTitle(item.title);
        const sourceDomain = sourceDomainFromUrl(item.link);
        const scMatch = classifySantaCatarinaNews({
          title: cleanTitle,
          summary: item.contentSnippet ?? item.content ?? null,
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
          summary: item.contentSnippet,
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
            link: item.link,
            source_name: sourceName ?? item.creator ?? feed.title ?? 'Google News',
            source_url: feed.link ?? null,
            source_domain: sourceDomain,
            story_key: storyKey,
            published_at: new Date(publishedAt).toISOString(),
            summary: item.contentSnippet ?? item.content ?? null,
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
