import Parser from 'rss-parser';
import { getSupabaseAdmin } from './supabaseAdmin';
import { buildGoogleNewsRssUrl, normalizeExternalId } from './googleNews';
import { inferAngle, scoreNews } from './scoring';
import type { RssQuery } from './types';

const parser = new Parser();

export async function collectNews() {
  const supabase = getSupabaseAdmin();

  const { data: queries, error } = await supabase
    .from('rss_queries')
    .select('*')
    .eq('enabled', true)
    .order('priority_weight', { ascending: false })
    .limit(80);

  if (error) throw error;

  let inserted = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (const query of (queries ?? []) as RssQuery[]) {
    try {
      const feed = await parser.parseURL(buildGoogleNewsRssUrl(query.query));
      const items = feed.items.slice(0, 15);

      for (const item of items) {
        if (!item.link || !item.title) {
          skipped += 1;
          continue;
        }

        const externalId = normalizeExternalId(item.link);
        const publishedAt = item.isoDate ?? item.pubDate ?? null;
        const score = scoreNews({
          title: item.title,
          summary: item.contentSnippet,
          queryWeight: query.priority_weight,
          publishedAt,
        });

        const { error: insertError } = await supabase.from('news_items').upsert(
          {
            external_id: externalId,
            title: item.title,
            link: item.link,
            source_name: item.creator ?? feed.title ?? 'Google News',
            source_url: feed.link ?? null,
            published_at: publishedAt ? new Date(publishedAt).toISOString() : null,
            summary: item.contentSnippet ?? item.content ?? null,
            query_label: query.label,
            topic: query.topic,
            city: query.city,
            region: query.region,
            opportunity_score: score,
            angle: inferAngle(item.title, query.topic, query.city),
            status: 'novo',
          },
          { onConflict: 'external_id', ignoreDuplicates: false },
        );

        if (insertError) {
          errors.push(`${query.label}: ${insertError.message}`);
        } else {
          inserted += 1;
        }
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      errors.push(`${query.label}: ${message}`);
    }
  }

  await supabase.from('cron_runs').insert({
    job_name: 'collect-news',
    inserted_count: inserted,
    skipped_count: skipped,
    error_count: errors.length,
    errors,
  });

  return { inserted, skipped, errors };
}
