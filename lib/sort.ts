import type { NewsItem } from './types';
import type { StoryGroup } from './storyGroups';
import { instagramPotentialForGroup, instagramPotentialForItem } from './instagram';

export type RadarSort = 'potencial' | 'recente' | 'urgencia' | 'concorrencia' | 'instagram';

export const sortLabels: Record<RadarSort, string> = {
  potencial: 'Maior potencial',
  recente: 'Mais recente',
  urgencia: 'Mais urgente',
  concorrencia: 'Concorrência forte',
  instagram: 'Potencial Instagram',
};

export function getSortFromParam(value?: string | string[] | null): RadarSort {
  const raw = Array.isArray(value) ? value[0] : value;
  if (raw === 'recente' || raw === 'urgencia' || raw === 'concorrencia' || raw === 'instagram' || raw === 'potencial') return raw;
  return 'potencial';
}

function timeValue(dateIso: string | null | undefined) {
  const value = dateIso ? new Date(dateIso).getTime() : 0;
  return Number.isNaN(value) ? 0 : value;
}

export function sortNewsItems(items: NewsItem[], sort: RadarSort) {
  return [...items].sort((a, b) => {
    if (sort === 'recente') return timeValue(b.published_at) - timeValue(a.published_at) || (b.opportunity_score ?? 0) - (a.opportunity_score ?? 0);
    if (sort === 'concorrencia') return (b.media_repercussion_score ?? 0) - (a.media_repercussion_score ?? 0) || (b.media_mentions_count ?? 0) - (a.media_mentions_count ?? 0) || timeValue(b.published_at) - timeValue(a.published_at);
    if (sort === 'instagram') return instagramPotentialForItem(b) - instagramPotentialForItem(a) || timeValue(b.published_at) - timeValue(a.published_at);
    if (sort === 'urgencia') return timeValue(b.published_at) - timeValue(a.published_at) || (b.opportunity_score ?? 0) - (a.opportunity_score ?? 0);
    return (b.opportunity_score ?? 0) - (a.opportunity_score ?? 0) || timeValue(b.published_at) - timeValue(a.published_at);
  });
}

export function sortStoryGroups(groups: StoryGroup[], sort: RadarSort) {
  return [...groups].sort((a, b) => {
    if (sort === 'recente') return timeValue(b.latestPublishedAt) - timeValue(a.latestPublishedAt) || b.score - a.score;
    if (sort === 'urgencia') return b.urgencyScore - a.urgencyScore || timeValue(b.latestPublishedAt) - timeValue(a.latestPublishedAt);
    if (sort === 'concorrencia') return b.competitionScore - a.competitionScore || b.mentions - a.mentions || b.score - a.score;
    if (sort === 'instagram') return instagramPotentialForGroup(b) - instagramPotentialForGroup(a) || b.urgencyScore - a.urgencyScore;
    return b.score - a.score || b.urgencyScore - a.urgencyScore || b.competitionScore - a.competitionScore;
  });
}
