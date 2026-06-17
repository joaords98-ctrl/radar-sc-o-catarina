import type { SupabaseClient } from '@supabase/supabase-js';

type SourceProfile = {
  name: string;
  domain: string | null;
  priority_weight: number | null;
  is_competitor: boolean | null;
};

type NewsRow = {
  id: string;
  title: string;
  link: string;
  source_name: string | null;
  source_domain: string | null;
  published_at: string | null;
  opportunity_score: number | null;
  story_key: string | null;
};

const STOPWORDS = new Set([
  'a','o','os','as','um','uma','uns','umas','de','da','do','das','dos','em','no','na','nos','nas','por','para','com','sem','sobre','apos','após','que','e','ou','ao','aos','à','às',
  'sc','santa','catarina','brasil','video','vídeo','fotos','foto','diz','dizem','novo','nova','mais','menos','contra','sobre','apos','após'
]);

export function sourceDomainFromUrl(url: string | null | undefined) {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.toLowerCase().replace(/^www\./, '');
    // Google News often wraps the original URL. Keep hostname as a useful fallback.
    return host;
  } catch {
    return null;
  }
}

function normalizeText(input: string) {
  return input
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/https?:\/\/\S+/g, ' ')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function buildStoryKey(title: string) {
  const words = normalizeText(title)
    .split(' ')
    .filter((word) => word.length > 3 && !STOPWORDS.has(word));

  const unique = Array.from(new Set(words));
  const selected = unique.slice(0, 9);
  return selected.length ? selected.join('-') : normalizeText(title).slice(0, 80).replace(/\s+/g, '-');
}

function matchesProfile(row: NewsRow, profile: SourceProfile) {
  const profileDomain = profile.domain?.toLowerCase();
  const rowDomain = row.source_domain?.toLowerCase() ?? sourceDomainFromUrl(row.link)?.toLowerCase() ?? '';
  const sourceName = row.source_name?.toLowerCase() ?? '';
  const profileName = profile.name.toLowerCase();

  if (profileDomain && rowDomain.includes(profileDomain)) return true;
  if (profileName && sourceName.includes(profileName)) return true;
  return false;
}

function scoreGroup(rows: NewsRow[], profiles: SourceProfile[]) {
  const sourceNames = Array.from(new Set(rows.map((row) => row.source_name).filter(Boolean) as string[])).slice(0, 8);
  const matchedCompetitors = new Map<string, number>();

  for (const row of rows) {
    for (const profile of profiles) {
      if (!profile.is_competitor) continue;
      if (matchesProfile(row, profile)) {
        matchedCompetitors.set(profile.name, Math.max(matchedCompetitors.get(profile.name) ?? 0, profile.priority_weight ?? 3));
      }
    }
  }

  const competitorWeight = Array.from(matchedCompetitors.values()).reduce((sum, weight) => sum + weight, 0);
  const maxOpportunity = Math.max(...rows.map((row) => row.opportunity_score ?? 0), 0);
  const uniqueSources = sourceNames.length;
  const mentions = rows.length;

  // Proxy editorial: volume de veículos + peso de concorrentes + força da pauta.
  // Não representa likes/comentários reais de redes sociais.
  const mediaScore = Math.min(100, Math.round(mentions * 8 + uniqueSources * 6 + competitorWeight * 5 + maxOpportunity * 0.25));

  return {
    mediaScore,
    sourceNames,
    competitorNames: Array.from(matchedCompetitors.keys()).slice(0, 8),
  };
}

export async function refreshRepercussionMetrics(supabase: SupabaseClient, options?: { sinceIso?: string }) {
  const sinceIso = options?.sinceIso ?? new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString();

  const [{ data: rows, error: rowsError }, { data: profiles, error: profilesError }] = await Promise.all([
    supabase
      .from('news_items')
      .select('id,title,link,source_name,source_domain,published_at,opportunity_score,story_key')
      .not('story_key', 'is', null)
      .gte('published_at', sinceIso)
      .limit(2500),
    supabase.from('source_profiles').select('name,domain,priority_weight,is_competitor'),
  ]);

  if (rowsError) throw rowsError;
  if (profilesError) throw profilesError;

  const groups = new Map<string, NewsRow[]>();
  for (const row of (rows ?? []) as NewsRow[]) {
    if (!row.story_key) continue;
    const current = groups.get(row.story_key) ?? [];
    current.push(row);
    groups.set(row.story_key, current);
  }

  const sourceProfiles = (profiles ?? []) as SourceProfile[];
  let updated = 0;

  for (const groupRows of groups.values()) {
    const metrics = scoreGroup(groupRows, sourceProfiles);
    const payload = {
      media_mentions_count: groupRows.length,
      media_repercussion_score: metrics.mediaScore,
      top_media_sources: metrics.sourceNames,
      competitor_hits_count: metrics.competitorNames.length,
      competitor_names: metrics.competitorNames,
      competitor_notes: metrics.competitorNames.length
        ? `Repercutiu em: ${metrics.competitorNames.join(', ')}`
        : 'Sem concorrente mapeado detectado; possível repercussão em fontes não cadastradas.',
    };

    for (const row of groupRows) {
      const { error } = await supabase.from('news_items').update(payload).eq('id', row.id);
      if (!error) updated += 1;
    }
  }

  return { storyGroups: groups.size, repercussionRowsUpdated: updated };
}
