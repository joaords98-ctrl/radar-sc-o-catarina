import Parser from 'rss-parser';
import { getSupabaseAdmin } from './supabaseAdmin';
import { buildGoogleNewsRssUrl, normalizeExternalId, splitGoogleNewsTitle } from './googleNews';
import { inferAngle, scoreNews } from './scoring';
import { classifySantaCatarinaNews } from './scGeo';
import { buildStoryKey, refreshRepercussionMetrics, sourceDomainFromUrl } from './repercussion';
import { getRecentCutoffIso, getRecentHours, isRecentPublishedAt } from './recent';
import type { RssQuery } from './types';

const parser = new Parser();

export async function collectNews() {
  const supabase = getSupabaseAdmin();
  const recentHours = getRecentHours();
  const cutoffIso = getRecentCutoffIso(recentHours);

  const { data: queries, error } = await supabase
    .from('rss_queries')
    .select('*')
    .eq('enabled', true)
    .order('priority_weight', { ascending: false })
    .limit(80);

  if (error) throw error;

  let inserted = 0;
  let updated = 0;
  let skipped = 0;
  let skippedOld = 0;
  let skippedWithoutDate = 0;
  let skippedOutOfState = 0;
  let skippedNoScContext = 0;
  const errors: string[] = [];

  for (const query of (queries ?? []) as RssQuery[]) {
    try {
      const feed = await parser.parseURL(buildGoogleNewsRssUrl(query.query));
      const items = feed.items.slice(0, 25);

      for (const item of items) {
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

  // Métrica de repercussão apenas para pautas recentes. Mantém histórico no banco, mas o painel prioriza o dia.
  const repercussion = await refreshRepercussionMetrics(supabase, { sinceIso: cutoffIso });

  await supabase.from('cron_runs').insert({
    job_name: 'collect-news',
    inserted_count: inserted,
    skipped_count: skipped,
    error_count: errors.length,
    errors,
  });

  return {
    inserted,
    updated,
    skipped,
    skippedOld,
    skippedWithoutDate,
    skippedOutOfState,
    skippedNoScContext,
    recentHours,
    cutoffIso,
    errors,
    ...repercussion,
  };
}
