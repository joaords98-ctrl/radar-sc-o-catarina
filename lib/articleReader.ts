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

/** Extrai o ID do artigo de uma URL do Google News (formato /articles/<ID> ou /rss/articles/<ID>). */
function extractGoogleArticleId(link: string): string | null {
  const m = link.match(/\/articles\/([^?/]+)/);
  return m?.[1] ?? null;
}

/**
 * Decodifica um link do Google News usando o método atual: primeiro busca os
 * parâmetros internos (signature/timestamp) na página do artigo, depois faz um
 * POST no endpoint batchexecute do Google, que devolve a URL real do portal.
 */
async function decodeViaBatchExecute(articleId: string, timeoutMs: number): Promise<string | null> {
  try {
    // 1) Buscar a página do artigo para pegar signature e timestamp.
    const pageRes = await fetchWithTimeout(
      `https://news.google.com/rss/articles/${articleId}`,
      timeoutMs,
      'follow',
    );
    const pageHtml = await pageRes.text();

    const dataMatch = pageHtml.match(/data-n-a-sg="([^"]+)"/);
    const timeMatch = pageHtml.match(/data-n-a-ts="([^"]+)"/);
    const signature = dataMatch?.[1];
    const timestamp = timeMatch?.[1];
    if (!signature || !timestamp) return null;

    // 2) Montar o payload do batchexecute.
    const payload = [
      'Fbv4je',
      `["garturlreq",[["X","X",["X","X"],null,null,1,1,"US:en",null,1,null,null,null,null,null,0,1],"X","X",1,[1,1,1],1,1,null,0,0,null,0],"${articleId}",${timestamp},"${signature}"]`,
    ];
    const body = `f.req=${encodeURIComponent(JSON.stringify([[payload]]))}`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    let json: string;
    try {
      const res = await fetch(
        'https://news.google.com/_/DotsSplashUi/data/batchexecute',
        {
          method: 'POST',
          signal: controller.signal,
          headers: {
            'content-type': 'application/x-www-form-urlencoded;charset=UTF-8',
            'User-Agent': 'Mozilla/5.0 (compatible; RadarSC/1.0)',
          },
          body,
        },
      );
      json = await res.text();
    } finally {
      clearTimeout(timeout);
    }

    // 3) A resposta traz a URL real dentro de um JSON aninhado; extraímos a primeira URL http externa.
    const urlMatch = json.match(/"(https?:\/\/(?!news\.google)[^"\\]+)"/);
    if (urlMatch?.[1]) return urlMatch[1];
  } catch {
    /* cai nos fallbacks */
  }
  return null;
}

/** Resolve um link do Google News para a URL real do portal. */
export async function resolveRealUrl(link: string, timeoutMs = 5000): Promise<string> {
  if (!isGoogleHost(link)) return link;

  // Método atual: decodificar via batchexecute (funciona com os links /articles/<ID> criptografados).
  const articleId = extractGoogleArticleId(link);
  if (articleId) {
    const decoded = await decodeViaBatchExecute(articleId, timeoutMs);
    if (decoded && !isGoogleHost(decoded)) return decoded;
  }

  // Fallback 1: seguir redirect manual (funciona em links antigos).
  try {
    const res = await fetchWithTimeout(link, timeoutMs, 'manual');
    const location = res.headers.get('location');
    if (location) {
      const redirected = new URL(location, link).toString();
      if (!isGoogleHost(redirected)) return redirected;
    }
    // Fallback 2: procurar uma URL externa no HTML.
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
export async function readArticle(link: string, timeoutMs = 9000): Promise<ArticleFacts> {
  const finalUrl = await resolveRealUrl(link, Math.min(6000, timeoutMs));
  console.log(
    `[redacao-ia] resolveu link: ${isGoogleHost(finalUrl) ? 'AINDA no Google News (decode falhou)' : 'portal real -> ' + finalUrl}`,
  );
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

  console.log(
    `[redacao-ia] leitura da fonte: finalUrl=${finalUrl} | fetched=${Boolean(
      title || description || paragraphs.length,
    )} | titulo=${title ? 'sim' : 'nao'} | paragrafos=${paragraphs.length} | tamanho=${rawForAI.length}`,
  );

  return {
    finalUrl,
    fetched: Boolean(title || description || paragraphs.length),
    title,
    description,
    paragraphs,
    rawForAI,
  };
}
