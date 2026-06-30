// Lê a matéria original a partir do link (resolvendo Google News) e extrai
// texto limpo o suficiente para servir de FONTE DE APURAÇÃO — nunca para
// reproduzir/parafrasear o texto do concorrente.

const GOOGLE_HOSTS = ['news.google.com', 'google.com'];

function decodeHtml(value: string) {
  return value
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}

function stripHtml(value: string) {
  return decodeHtml(
    value
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<[^>]+>/g, ' '),
  )
    .replace(/\s+/g, ' ')
    .trim();
}

function isGoogleHost(url: string) {
  try {
    const host = new URL(url).hostname.replace(/^www\./, '');
    return GOOGLE_HOSTS.some((g) => host === g || host.endsWith(`.${g}`));
  } catch {
    return false;
  }
}

function firstExternalUrl(html: string): string | null {
  const matches = Array.from(html.matchAll(/https?:\/\/[^"'<>\s)]+/gi))
    .map((m) => m[0].replace(/\\u003d/g, '=').replace(/\\u0026/g, '&'))
    .filter((url) => {
      try {
        const host = new URL(url).hostname.replace(/^www\./, '');
        return (
          !host.endsWith('google.com') &&
          !host.includes('gstatic') &&
          !host.includes('googleusercontent')
        );
      } catch {
        return false;
      }
    });
  return matches[0] ?? null;
}

async function fetchWithTimeout(url: string, ms: number, redirect: RequestRedirect = 'follow') {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), ms);
  try {
    return await fetch(url, {
      redirect,
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; RadarSC/1.0; +https://ocatarina.com.br)',
        Accept: 'text/html,application/xhtml+xml',
      },
    });
  } finally {
    clearTimeout(timeout);
  }
}

/** Resolve um link do Google News para a URL real do portal. */
export async function resolveRealUrl(link: string, timeoutMs = 4000): Promise<string> {
  if (!isGoogleHost(link)) return link;
  try {
    const res = await fetchWithTimeout(link, timeoutMs, 'manual');
    const location = res.headers.get('location');
    if (location) {
      const redirected = new URL(location, link).toString();
      if (!isGoogleHost(redirected)) return redirected;
    }
    const html = await res.text().catch(() => '');
    const external = firstExternalUrl(html);
    if (external) return external;
  } catch {
    /* mantém o link original */
  }
  return link;
}

export type ArticleFacts = {
  finalUrl: string;
  fetched: boolean;
  title: string;
  description: string;
  paragraphs: string[];
  /** Texto bruto consolidado, só para alimentar a IA como material de apuração. */
  rawForAI: string;
};

function meta(html: string, patterns: RegExp[]) {
  for (const p of patterns) {
    const m = html.match(p);
    if (m?.[1]) return stripHtml(m[1]);
  }
  return '';
}

/** Baixa a matéria e extrai fatos. Não publica nada: só apura. */
export async function readArticle(link: string, timeoutMs = 7000): Promise<ArticleFacts> {
  const finalUrl = await resolveRealUrl(link, Math.min(4000, timeoutMs));
  const empty: ArticleFacts = {
    finalUrl,
    fetched: false,
    title: '',
    description: '',
    paragraphs: [],
    rawForAI: '',
  };

  if (isGoogleHost(finalUrl) || !/^https?:\/\//i.test(finalUrl)) return empty;

  let html = '';
  try {
    const res = await fetchWithTimeout(finalUrl, timeoutMs);
    const ctype = res.headers.get('content-type') ?? '';
    if (!res.ok || !ctype.includes('text/html')) return { ...empty, finalUrl: res.url || finalUrl };
    html = await res.text();
  } catch {
    return empty;
  }

  const title = meta(html, [
    /<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["'][^>]*>/i,
    /<title[^>]*>([\s\S]*?)<\/title>/i,
  ]);
  const description = meta(html, [
    /<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)["'][^>]*>/i,
    /<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["'][^>]*>/i,
  ]);

  const paragraphs = Array.from(html.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi))
    .map((m) => stripHtml(m[1]))
    .filter((t) => t.length >= 60)
    .filter((t) => !/^https?:\/\//i.test(t))
    .filter(
      (t) =>
        !/cookies|newsletter|publicidade|assine|compartilhe|whatsapp|inscreva|leia tamb[eé]m|continue lendo/i.test(
          t,
        ),
    )
    .slice(0, 12);

  const rawForAI = [title, description, ...paragraphs].filter(Boolean).join('\n').slice(0, 6000);

  return {
    finalUrl,
    fetched: Boolean(title || description || paragraphs.length),
    title,
    description,
    paragraphs,
    rawForAI,
  };
}
