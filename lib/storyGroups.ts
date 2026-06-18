import type { NewsItem } from '@/lib/types';

export type StoryGroup = {
  id: string;
  headline: string;
  topic: string | null;
  city: string | null;
  region: string | null;
  firstPublishedAt: string | null;
  latestPublishedAt: string | null;
  firstSource: string | null;
  leadItem: NewsItem;
  items: NewsItem[];
  sources: string[];
  competitors: string[];
  mentions: number;
  score: number;
  urgencyScore: number;
  competitionScore: number;
  riskLevel: 'baixo' | 'medio' | 'alto';
  suggestedFormat: 'site' | 'feed' | 'reels' | 'story' | 'apurar';
  action: string;
  vacuum: boolean;
  angle: string;
};

const STOPWORDS = new Set([
  'a','o','os','as','um','uma','uns','umas','de','da','do','das','dos','em','no','na','nos','nas','por','para','com','sem','sobre','apos','após','que','e','ou','ao','aos','à','às','se','sua','seu','suas','seus','foi','ser','tem','ter','mais','menos','novo','nova','sc','santa','catarina','brasil','video','vídeo','foto','fotos','veja','diz','dizem','aponta','confira','urgente'
]);

const RISK_WORDS = ['suspeito', 'investigado', 'denúncia', 'acusado', 'fraude', 'corrupção', 'abuso', 'estupro', 'morte', 'assassinato', 'homicídio'];
const VIDEO_WORDS = ['vídeo', 'video', 'flagra', 'imagens', 'câmera', 'camera', 'viraliza', 'mostra'];
const HARD_NEWS_WORDS = ['operação', 'prisão', 'preso', 'polícia', 'mandado', 'defesa civil', 'chuva', 'enchente', 'acidente'];
const POLITICAL_WORDS = ['prefeito', 'vereador', 'deputado', 'governo', 'licitação', 'contrato', 'tce', 'mpsc', 'câmara', 'assembleia'];

function normalize(input: string) {
  return input
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/https?:\/\/\S+/g, ' ')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function tokens(title: string) {
  return normalize(title)
    .split(' ')
    .filter((w) => w.length > 3 && !STOPWORDS.has(w))
    .slice(0, 14);
}

function signature(item: NewsItem) {
  if (item.story_key) return item.story_key;
  const selected = Array.from(new Set(tokens(item.title))).slice(0, 8);
  return selected.join('-') || normalize(item.title).slice(0, 60).replace(/\s+/g, '-');
}

function similarity(a: string[], b: string[]) {
  const sa = new Set(a);
  const sb = new Set(b);
  if (!sa.size || !sb.size) return 0;
  let inter = 0;
  for (const v of sa) if (sb.has(v)) inter += 1;
  const union = new Set([...sa, ...sb]).size;
  return inter / union;
}

function ageHours(dateIso: string | null) {
  if (!dateIso) return 999;
  const t = new Date(dateIso).getTime();
  if (Number.isNaN(t)) return 999;
  return (Date.now() - t) / 36e5;
}

function uniq(values: Array<string | null | undefined>) {
  return Array.from(new Set(values.filter(Boolean) as string[]));
}

function riskLevelFor(items: NewsItem[]): 'baixo' | 'medio' | 'alto' {
  const text = items.map((i) => `${i.title} ${i.summary ?? ''}`).join(' ').toLowerCase();
  const hits = RISK_WORDS.filter((w) => text.includes(w)).length;
  if (hits >= 3) return 'alto';
  if (hits >= 1) return 'medio';
  return 'baixo';
}

function suggestedFormatFor(items: NewsItem[], score: number): StoryGroup['suggestedFormat'] {
  const text = items.map((i) => `${i.title} ${i.summary ?? ''}`).join(' ').toLowerCase();
  if (riskLevelFor(items) === 'alto') return 'apurar';
  if (VIDEO_WORDS.some((w) => text.includes(w))) return 'reels';
  if (score >= 85 && HARD_NEWS_WORDS.some((w) => text.includes(w))) return 'site';
  if (POLITICAL_WORDS.some((w) => text.includes(w))) return 'site';
  if (score >= 75) return 'feed';
  return 'story';
}

function actionFor(group: Omit<StoryGroup, 'action'>) {
  if (group.riskLevel === 'alto') return 'Reapurar antes de publicar: buscar fonte oficial e evitar afirmações categóricas.';
  if (group.vacuum && group.score >= 70) return 'Publicar rápido: pauta quente com baixa saturação detectada.';
  if (group.competitionScore >= 70) return 'Disputar agora: concorrência já entrou na pauta.';
  if (group.urgencyScore >= 80) return 'Atualizar em tempo real e transformar em matéria curta.';
  if (group.score >= 75) return 'Produzir matéria para site e adaptar para feed.';
  return 'Monitorar ou usar como nota curta/story.';
}

function angleFor(items: NewsItem[], topic: string | null, city: string | null) {
  const existing = items.find((i) => i.angle)?.angle;
  if (existing) return existing;
  const place = city ? ` em ${city}` : ' em Santa Catarina';
  const text = items.map((i) => i.title).join(' ').toLowerCase();
  if (text.includes('licitação') || text.includes('contrato') || text.includes('tce')) return `Apurar valores, responsáveis, contrato e impacto ao contribuinte${place}.`;
  if (text.includes('operação') || text.includes('prisão') || text.includes('polícia')) return `Checar release oficial e publicar atualização objetiva de segurança pública${place}.`;
  if (text.includes('chuva') || text.includes('enchente') || text.includes('defesa civil')) return `Atualizar áreas afetadas, orientações e cobrança de prevenção${place}.`;
  if (topic) return `Reapurar como pauta de ${topic}, com dado local e fonte primária${place}.`;
  return `Checar fonte primária e publicar com título próprio do O Catarina${place}.`;
}

function buildGroupFromItems(id: string, items: NewsItem[]): StoryGroup {
  const sorted = [...items].sort((a, b) => {
    const sa = (b.opportunity_score ?? 0) - (a.opportunity_score ?? 0);
    if (sa) return sa;
    return new Date(b.published_at ?? 0).getTime() - new Date(a.published_at ?? 0).getTime();
  });
  const lead = sorted[0];
  const byTime = [...items].sort((a, b) => new Date(a.published_at ?? 0).getTime() - new Date(b.published_at ?? 0).getTime());
  const latestByTime = [...items].sort((a, b) => new Date(b.published_at ?? 0).getTime() - new Date(a.published_at ?? 0).getTime());
  const sources = uniq(items.flatMap((i) => [i.source_name, ...(i.top_media_sources ?? [])])).slice(0, 12);
  const competitors = uniq(items.flatMap((i) => i.competitor_names ?? [])).slice(0, 10);
  const mentions = Math.max(items.length, ...items.map((i) => i.media_mentions_count ?? 1));
  const maxOpportunity = Math.max(...items.map((i) => i.opportunity_score ?? 0), 0);
  const maxRepercussion = Math.max(...items.map((i) => i.media_repercussion_score ?? 0), 0);
  const minAge = Math.min(...items.map((i) => ageHours(i.published_at)));
  const urgencyScore = Math.min(100, Math.round((minAge <= 2 ? 100 : minAge <= 6 ? 85 : minAge <= 12 ? 70 : minAge <= 24 ? 55 : 30) + Math.min(10, mentions * 2)));
  const competitionScore = Math.min(100, Math.round(maxRepercussion * 0.7 + competitors.length * 12 + Math.max(0, mentions - 1) * 5));
  const score = Math.min(100, Math.round(maxOpportunity * 0.45 + urgencyScore * 0.25 + competitionScore * 0.25 + Math.min(10, sources.length * 2)));
  const riskLevel = riskLevelFor(items);
  const vacuum = competitors.length === 0 && mentions <= 2 && score >= 65;
  const suggestedFormat = suggestedFormatFor(items, score);
  const partial = {
    id,
    headline: lead.title,
    topic: lead.topic ?? items.find((i) => i.topic)?.topic ?? null,
    city: lead.city ?? items.find((i) => i.city)?.city ?? null,
    region: lead.region ?? items.find((i) => i.region)?.region ?? null,
    firstPublishedAt: byTime[0]?.published_at ?? null,
    latestPublishedAt: latestByTime[0]?.published_at ?? null,
    firstSource: byTime[0]?.source_name ?? null,
    leadItem: lead,
    items: sorted,
    sources,
    competitors,
    mentions,
    score,
    urgencyScore,
    competitionScore,
    riskLevel,
    suggestedFormat,
    vacuum,
    angle: angleFor(items, lead.topic ?? null, lead.city ?? null),
  };
  return { ...partial, action: actionFor(partial) };
}

export function buildStoryGroups(items: NewsItem[], maxGroups = 40): StoryGroup[] {
  const clusters: Array<{ id: string; toks: string[]; items: NewsItem[] }> = [];

  for (const item of items) {
    const t = tokens(item.title);
    const sig = signature(item);
    let bestIndex = -1;
    let bestScore = 0;

    for (let i = 0; i < clusters.length; i++) {
      const cluster = clusters[i];
      const sameCity = !item.city || !cluster.items[0]?.city || item.city === cluster.items[0].city;
      const sameTopic = !item.topic || !cluster.items[0]?.topic || item.topic === cluster.items[0].topic;
      const exactStory = item.story_key && cluster.id === item.story_key;
      const sim = exactStory ? 1 : similarity(t, cluster.toks);
      if ((exactStory || (sim >= 0.42 && sameCity && sameTopic)) && sim > bestScore) {
        bestScore = sim;
        bestIndex = i;
      }
    }

    if (bestIndex >= 0) {
      clusters[bestIndex].items.push(item);
      clusters[bestIndex].toks = Array.from(new Set([...clusters[bestIndex].toks, ...t])).slice(0, 18);
    } else {
      clusters.push({ id: sig || item.id, toks: t, items: [item] });
    }
  }

  return clusters
    .map((c) => buildGroupFromItems(c.id, c.items))
    .sort((a, b) => b.score - a.score || b.urgencyScore - a.urgencyScore || b.competitionScore - a.competitionScore)
    .slice(0, maxGroups);
}

export function getRecentHoursFromSearchParam(value?: string | string[] | null) {
  const raw = Array.isArray(value) ? value[0] : value;
  const parsed = raw ? Number(raw) : Number(process.env.RADAR_RECENT_HOURS ?? 24);
  if ([6, 12, 24, 36, 48].includes(parsed)) return parsed;
  return Number(process.env.RADAR_RECENT_HOURS ?? 24);
}

export function cutoffIsoForHours(hours: number) {
  return new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
}
