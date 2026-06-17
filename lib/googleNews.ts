export function buildGoogleNewsRssUrl(query: string) {
  const encoded = encodeURIComponent(query);
  return `https://news.google.com/rss/search?q=${encoded}&hl=pt-BR&gl=BR&ceid=BR:pt-419`;
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
