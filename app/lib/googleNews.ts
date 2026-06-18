import { getRecentHours } from './recent';

function hasRecentOperator(query: string) {
  return /\b(when:\d+[hdm]|after:\d{4}-\d{2}-\d{2}|before:\d{4}-\d{2}-\d{2})\b/i.test(query);
}

function withRecentOperator(query: string) {
  const cleaned = query.trim();
  if (hasRecentOperator(cleaned)) return cleaned;

  const hours = getRecentHours();
  if (hours <= 24) return `${cleaned} when:1d`;
  const days = Math.max(1, Math.ceil(hours / 24));
  return `${cleaned} when:${days}d`;
}

export function buildGoogleNewsRssUrl(query: string) {
  const encoded = encodeURIComponent(withRecentOperator(query));
  // scoring=n força ordenação por data no Google News, reduzindo notícia velha na coleta.
  return `https://news.google.com/rss/search?q=${encoded}&hl=pt-BR&gl=BR&ceid=BR:pt-419&scoring=n`;
}

export function normalizeExternalId(link: string) {
  return link.trim().replace(/[#?].*$/, '').toLowerCase();
}

export function splitGoogleNewsTitle(title: string) {
  const parts = title.split(' - ');
  if (parts.length < 2) return { cleanTitle: title.trim(), sourceName: null };
  const sourceName = parts.pop()?.trim() || null;
  const cleanTitle = parts.join(' - ').trim();
  return { cleanTitle: cleanTitle || title.trim(), sourceName };
}
