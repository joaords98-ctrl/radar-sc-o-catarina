import type { NewsItem } from '@/lib/types';
import type { StoryGroup } from '@/lib/storyGroups';
import { instagramPotentialForGroup } from '@/lib/instagram';

export type ClippingAction = 'publicar_agora' | 'apurar' | 'monitorar' | 'descartar';

export type ClippingStatsRow = {
  label: string;
  count: number;
  score: number;
};

export type ClippingReport = {
  generatedAt: string;
  hours: number;
  totalNews: number;
  totalStories: number;
  urgentCount: number;
  unpublishedCount: number;
  officialSourceCount: number;
  topStories: StoryGroup[];
  unpublishedHotStories: StoryGroup[];
  sourceRanking: ClippingStatsRow[];
  cityRanking: ClippingStatsRow[];
  topicRanking: ClippingStatsRow[];
  officialStories: StoryGroup[];
  summaryText: string;
};

const officialHints = [
  'gov.br', 'sc.gov.br', 'pm.sc.gov.br', 'pc.sc.gov.br', 'policiacivil.sc.gov.br',
  'cbm.sc.gov.br', 'defesacivil.sc.gov.br', 'mpsc.mp.br', 'tjsc.jus.br', 'tcesc.tc.br',
  'alesc.sc.gov.br', 'prf.gov.br', 'dnit.gov.br', 'prefeitura', 'camara', 'câmara', 'govsc'
];

function timeLabel(iso: string | null) {
  if (!iso) return 'sem data';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return 'sem data';
  return date.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
}

function isOfficialText(text: string) {
  const lower = text.toLowerCase();
  return officialHints.some((hint) => lower.includes(hint));
}

export function hasOfficialSource(group: StoryGroup) {
  const haystack = [
    group.firstSource,
    group.leadItem.source_domain,
    group.leadItem.source_name,
    group.leadItem.source_url,
    ...group.sources,
    ...group.items.map((item) => `${item.source_name ?? ''} ${item.source_domain ?? ''} ${item.source_url ?? ''} ${item.link ?? ''}`),
  ].filter(Boolean).join(' ');
  return isOfficialText(haystack);
}

export function clippingActionFor(group: StoryGroup): ClippingAction {
  if (group.riskLevel === 'alto') return 'apurar';
  if (group.score >= 82 || group.urgencyScore >= 86 || instagramPotentialForGroup(group) >= 88) return 'publicar_agora';
  if (group.score >= 55 || group.competitionScore >= 45) return 'monitorar';
  return 'descartar';
}

export function clippingActionLabel(action: ClippingAction) {
  const labels: Record<ClippingAction, string> = {
    publicar_agora: 'Publicar agora',
    apurar: 'Apurar antes',
    monitorar: 'Monitorar',
    descartar: 'Descartar/baixo valor',
  };
  return labels[action];
}

function groupIsPublished(group: StoryGroup) {
  return group.items.some((item) => item.status === 'publicado');
}

function rank(values: Array<{ label: string | null | undefined; score: number }>, max = 10): ClippingStatsRow[] {
  const map = new Map<string, { count: number; score: number }>();
  values.forEach(({ label, score }) => {
    const key = label?.trim() || 'Não classificado';
    const existing = map.get(key) ?? { count: 0, score: 0 };
    existing.count += 1;
    existing.score += score;
    map.set(key, existing);
  });
  return Array.from(map.entries())
    .map(([label, value]) => ({ label, count: value.count, score: Math.round(value.score / Math.max(1, value.count)) }))
    .sort((a, b) => b.count - a.count || b.score - a.score || a.label.localeCompare(b.label))
    .slice(0, max);
}

function storyLine(group: StoryGroup, index: number) {
  const action = clippingActionLabel(clippingActionFor(group));
  const published = groupIsPublished(group) ? 'Publicado pelo O Catarina' : 'Ainda não publicado';
  const insta = instagramPotentialForGroup(group);
  const location = group.city ?? group.region ?? 'SC';
  const competitors = group.competitors.length ? group.competitors.slice(0, 4).join(', ') : 'sem concorrentes mapeados';
  return `${index}. ${group.headline}\n   Local: ${location} · Tema: ${group.topic ?? 'não classificado'}\n   Prioridade: ${group.score} · Urgência: ${group.urgencyScore} · Concorrência: ${group.competitionScore} · Instagram: ${insta}\n   Veiculações: ${group.mentions} · Primeiro meio: ${group.firstSource ?? 'não identificado'} · Atualizado: ${timeLabel(group.latestPublishedAt)}\n   Concorrentes: ${competitors}\n   Status O Catarina: ${published}\n   Ação: ${action}`;
}

export function generateClippingText(report: Omit<ClippingReport, 'summaryText'>) {
  const hot = report.topStories.slice(0, 8).map(storyLine).join('\n\n') || 'Sem pautas relevantes no período.';
  const notPublished = report.unpublishedHotStories.slice(0, 8).map(storyLine).join('\n\n') || 'Nenhuma pauta quente pendente detectada.';
  const cities = report.cityRanking.slice(0, 8).map((r, i) => `${i + 1}. ${r.label} — ${r.count} pautas`).join('\n') || 'Sem cidades detectadas.';
  const sources = report.sourceRanking.slice(0, 8).map((r, i) => `${i + 1}. ${r.label} — ${r.count} veiculações`).join('\n') || 'Sem fontes detectadas.';
  const official = report.officialStories.slice(0, 5).map((g, i) => `${i + 1}. ${g.headline} — ${g.firstSource ?? 'fonte oficial/órgão detectado'}`).join('\n') || 'Sem fonte oficial detectada entre as principais pautas.';

  return [
    `CLIPPING O CATARINA — ÚLTIMAS ${report.hours}H`,
    `Gerado em: ${timeLabel(report.generatedAt)}`,
    '',
    `Total de notícias: ${report.totalNews}`,
    `Pautas agrupadas: ${report.totalStories}`,
    `Urgentes: ${report.urgentCount}`,
    `Quentes ainda não publicadas: ${report.unpublishedCount}`,
    `Com fonte oficial detectada: ${report.officialSourceCount}`,
    '',
    'PRINCIPAIS PAUTAS',
    hot,
    '',
    'O CATARINA AINDA NÃO PUBLICOU',
    notPublished,
    '',
    'CIDADES MAIS QUENTES',
    cities,
    '',
    'FONTES MAIS ATIVAS',
    sources,
    '',
    'FONTES OFICIAIS / CHECAGEM',
    official,
  ].join('\n');
}

export function buildClippingReport(groups: StoryGroup[], items: NewsItem[], hours: number): ClippingReport {
  const topStories = [...groups]
    .sort((a, b) => b.score - a.score || b.urgencyScore - a.urgencyScore || b.competitionScore - a.competitionScore)
    .slice(0, 60);
  const unpublishedHotStories = topStories
    .filter((group) => !groupIsPublished(group))
    .filter((group) => group.score >= 60 || group.urgencyScore >= 75 || instagramPotentialForGroup(group) >= 80)
    .slice(0, 30);
  const officialStories = topStories.filter(hasOfficialSource).slice(0, 20);
  const urgentCount = groups.filter((g) => clippingActionFor(g) === 'publicar_agora').length;
  const officialSourceCount = groups.filter(hasOfficialSource).length;
  const sourceRanking = rank(items.map((item) => ({ label: item.source_name ?? item.source_domain, score: item.opportunity_score ?? 0 })), 15);
  const cityRanking = rank(groups.map((group) => ({ label: group.city ?? group.region, score: group.score })), 15);
  const topicRanking = rank(groups.map((group) => ({ label: group.topic, score: group.score })), 15);
  const reportBase = {
    generatedAt: new Date().toISOString(),
    hours,
    totalNews: items.length,
    totalStories: groups.length,
    urgentCount,
    unpublishedCount: unpublishedHotStories.length,
    officialSourceCount,
    topStories,
    unpublishedHotStories,
    sourceRanking,
    cityRanking,
    topicRanking,
    officialStories,
  };
  return { ...reportBase, summaryText: generateClippingText(reportBase) };
}
