import type { NewsItem } from './types';
import type { StoryGroup } from './storyGroups';

export type InstagramFormat = 'reels' | 'feed' | 'story' | 'carrossel' | 'monitorar';

const VIDEO_WORDS = ['vídeo', 'video', 'flagra', 'imagens', 'câmera', 'camera', 'mostra', 'viraliza', 'momento'];
const EMOTION_WORDS = ['escapa', 'tragédia', 'por pouco', 'assusta', 'impressiona', 'choca', 'grave', 'urgente'];
const UTILITY_WORDS = ['trânsito', 'rodovia', 'interdita', 'alerta', 'previsão', 'chuva', 'defesa civil', 'serviço', 'bloqueio'];
const POLITICS_WORDS = ['prefeito', 'vereador', 'governo', 'câmara', 'assembleia', 'contrato', 'licitação', 'denúncia', 'tce', 'mpsc'];
const HARD_RISK_WORDS = ['estupro', 'abuso', 'menor', 'criança', 'suicídio'];

function textOf(item: NewsItem) {
  return `${item.title ?? ''} ${item.summary ?? ''} ${item.topic ?? ''}`.toLowerCase();
}

function groupText(group: StoryGroup) {
  return group.items.map(textOf).join(' ');
}

function hasAny(text: string, words: string[]) {
  return words.some((word) => text.includes(word));
}

function clamp(score: number) {
  return Math.max(0, Math.min(100, Math.round(score)));
}

function ageHours(dateIso: string | null | undefined) {
  if (!dateIso) return 999;
  const time = new Date(dateIso).getTime();
  if (Number.isNaN(time)) return 999;
  return Math.max(0, (Date.now() - time) / 36e5);
}

export function instagramPotentialForItem(item: NewsItem) {
  const text = textOf(item);
  let score = 0;

  score += Math.min(35, (item.opportunity_score ?? 0) * 0.35);
  score += Math.min(18, (item.media_repercussion_score ?? 0) * 0.18);
  score += Math.min(12, (item.media_mentions_count ?? 1) * 3);

  const age = ageHours(item.published_at);
  score += age <= 2 ? 24 : age <= 6 ? 18 : age <= 12 ? 12 : age <= 24 ? 7 : 0;

  if (hasAny(text, VIDEO_WORDS)) score += 22;
  if (hasAny(text, EMOTION_WORDS)) score += 13;
  if (hasAny(text, UTILITY_WORDS)) score += 10;
  if (hasAny(text, POLITICS_WORDS)) score += 9;
  if (item.city) score += 6;
  if (item.competitor_names?.length) score += Math.min(10, item.competitor_names.length * 4);
  if (hasAny(text, HARD_RISK_WORDS)) score -= 18;

  return clamp(score);
}

export function instagramPotentialForGroup(group: StoryGroup) {
  const text = groupText(group);
  let score = 0;

  score += group.score * 0.3;
  score += group.urgencyScore * 0.22;
  score += group.competitionScore * 0.18;
  score += Math.min(16, group.mentions * 4);
  if (hasAny(text, VIDEO_WORDS)) score += 20;
  if (hasAny(text, EMOTION_WORDS)) score += 12;
  if (hasAny(text, UTILITY_WORDS)) score += 8;
  if (group.city) score += 6;
  if (group.riskLevel === 'alto') score -= 18;

  return clamp(score);
}

export function suggestedInstagramFormatForItem(item: NewsItem): InstagramFormat {
  const text = textOf(item);
  const potential = instagramPotentialForItem(item);
  if (hasAny(text, HARD_RISK_WORDS)) return 'monitorar';
  if (hasAny(text, VIDEO_WORDS)) return 'reels';
  if (hasAny(text, UTILITY_WORDS)) return 'story';
  if (hasAny(text, POLITICS_WORDS)) return 'carrossel';
  if (potential >= 75) return 'feed';
  return 'story';
}

export function suggestedInstagramFormatForGroup(group: StoryGroup): InstagramFormat {
  const text = groupText(group);
  const potential = instagramPotentialForGroup(group);
  if (group.riskLevel === 'alto') return 'monitorar';
  if (hasAny(text, VIDEO_WORDS)) return 'reels';
  if (hasAny(text, UTILITY_WORDS)) return 'story';
  if (hasAny(text, POLITICS_WORDS)) return 'carrossel';
  if (potential >= 75) return 'feed';
  return 'story';
}

export function instagramActionForItem(item: NewsItem) {
  const text = textOf(item);
  const format = suggestedInstagramFormatForItem(item);
  if (format === 'monitorar') return 'Apurar com cautela antes de postar. Evite exposição indevida e procure fonte oficial.';
  if (format === 'reels') return 'Prioridade para Reels/Stories: usar gancho visual, contexto curto e chamada para acompanhar o caso.';
  if (format === 'story') return 'Publicar como alerta rápido nos Stories e atualizar se houver fonte oficial.';
  if (format === 'carrossel') return 'Transformar em carrossel explicativo com contexto local, dados e fonte oficial.';
  if (hasAny(text, EMOTION_WORDS)) return 'Usar legenda curta com gancho forte, sem exagerar além do que a fonte confirma.';
  return 'Publicar no feed se houver imagem boa; caso contrário, usar como story curto.';
}

export function buildInstagramDraftForItem(item: NewsItem) {
  const place = item.city ?? item.region ?? 'Santa Catarina';
  const title = item.title.replace(/\s+/g, ' ').trim();
  const hook = title.length > 110 ? `${title.slice(0, 107)}...` : title;
  const format = suggestedInstagramFormatForItem(item);
  const hashtags = ['#SantaCatarina', '#OCatarina', '#NoticiasSC'];
  if (item.city) hashtags.splice(1, 0, `#${item.city.replace(/\s+/g, '')}`);
  if (item.topic?.includes('Trânsito')) hashtags.push('#TransitoSC');
  if (item.topic?.includes('Política')) hashtags.push('#PoliticaSC');
  const limitedHashtags = Array.from(new Set(hashtags)).slice(0, 5).join(' ');

  const caption = `${hook}\n\nO caso entrou no radar do O Catarina em ${place}. A informação deve ser acompanhada com checagem de fonte oficial e atualização dos desdobramentos.\n\n${limitedHashtags}`;
  const reels = `ABERTURA: ${hook}\n\nCONTEXTO: O caso foi localizado no radar de notícias de ${place}. Antes de cravar qualquer conclusão, é importante confirmar a fonte oficial.\n\nFECHAMENTO: O Catarina acompanha e atualiza assim que houver novos dados.`;
  const story = `ALERTA EM ${place.toUpperCase()}\n${hook}\n\nAcompanhe no O Catarina.`;
  const card = `${hook}\n\n${place}`;

  return { format, caption, reels, story, card };
}
