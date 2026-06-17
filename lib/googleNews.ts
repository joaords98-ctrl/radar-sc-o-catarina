export function buildGoogleNewsRssUrl(query: string) {
  const encoded = encodeURIComponent(query);
  return `https://news.google.com/rss/search?q=${encoded}&hl=pt-BR&gl=BR&ceid=BR:pt-419`;
}

export function normalizeExternalId(link: string) {
  return link.trim().replace(/[#?].*$/, '').toLowerCase();
}
