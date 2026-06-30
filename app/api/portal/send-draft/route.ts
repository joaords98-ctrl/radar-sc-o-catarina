import { NextRequest, NextResponse } from 'next/server';
import crypto from 'node:crypto';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

function cleanEndpoint(value: string | undefined) {
  return (value ?? '').trim().replace(/^["']|["']$/g, '').trim();
}

function fingerprint(value: string) {
  const cleaned = cleanEndpoint(value);
  if (!cleaned) return 'empty';
  return `${cleaned.length}:${crypto.createHash('sha256').update(cleaned).digest('hex').slice(0, 10)}`;
}

function removeSourceLinks(value: string) {
  return String(value ?? '')
    .replace(/\*\*Fonte inicial para checagem:\*\*\s*https?:\/\/\S+/gi, '')
    .replace(/Fonte inicial para checagem:\s*https?:\/\/\S+/gi, '')
    .replace(/https?:\/\/news\.google\.com\/rss\/articles\/\S+/gi, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function looksLikeUrlOnly(value: string) {
  const cleaned = String(value ?? '').trim();
  if (!cleaned) return true;
  const compact = cleaned.replace(/\s+/g, '');
  return /^https?:\/\//i.test(compact) && !/[.!?]\s+[A-ZÁÉÍÓÚÃÕÂÊÔÇ]/.test(cleaned);
}

function fallbackBody(title: string, supportLine: string, category: unknown, city: unknown) {
  const place = typeof city === 'string' && city.trim() ? city.trim() : 'Santa Catarina';
  const lead = supportLine
    ? `**${place}** — ${supportLine.trim()}`
    : `**${place}** — A pauta sobre **${title}** foi salva como rascunho para revisão da redação do **O Catarina**.`;
  const sensitive = /denúncia|denuncia|escândalo|escandalo|investigação|investigacao|fraude|superfaturamento|tce|mpsc|gaeco/i.test(`${title} ${supportLine} ${String(category ?? '')}`);
  const caution = sensitive
    ? '\n\nPor se tratar de assunto sensível, a redação deve separar **fato confirmado**, **suspeita**, **denúncia**, **investigação** ou **acusação**, sem apontar culpa antes de confirmação oficial.'
    : '';
  return `${lead}\n\nA matéria precisa ser revisada antes da publicação, com checagem de data, local, órgão responsável, envolvidos e desdobramentos.${caution}`;
}

export async function GET() {
  const endpoint = cleanEndpoint(process.env.PORTAL_DRAFT_ENDPOINT);
  const token = cleanEndpoint(process.env.PORTAL_DRAFT_TOKEN);

  return NextResponse.json({
    ok: true,
    endpoint: 'portal-send-draft',
    version: 'v14.11-debug',
    portalDraftEndpoint: endpoint || null,
    hasPortalDraftToken: Boolean(token),
    portalDraftTokenFingerprint: fingerprint(token),
    expectedPortalFingerprintShouldMatch: '40:f86ad8c04b',
  });
}

export async function POST(req: NextRequest) {
  try {
    const endpoint = cleanEndpoint(process.env.PORTAL_DRAFT_ENDPOINT);
    const token = cleanEndpoint(process.env.PORTAL_DRAFT_TOKEN);

    if (!endpoint) {
      return NextResponse.json(
        { ok: false, error: 'Configure PORTAL_DRAFT_ENDPOINT na Vercel.' },
        { status: 500 },
      );
    }

    const body = await req.json().catch(() => ({}));
    const title = String(body.title ?? '').trim();
    const supportLine = String(body.supportLine ?? '').trim();
    const rawContent = removeSourceLinks(String(body.content ?? '').trim());
    const content = looksLikeUrlOnly(rawContent)
      ? fallbackBody(title, supportLine, body.category, body.city)
      : rawContent;

    if (!title || !content) {
      return NextResponse.json(
        { ok: false, error: 'Título e conteúdo são obrigatórios.' },
        { status: 400 },
      );
    }

    const payload = {
      title,
      excerpt: supportLine,
      content,
      status: 'draft',
      category: body.category ?? null,
      city: body.city ?? null,
      sourceUrl: null,
      origin: 'radar-sc-o-catarina',
    };

    const headers = {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}`, 'X-Radar-Token': token } : {}),
    };
    const payloadText = JSON.stringify(payload);

    let response = await fetch(endpoint, {
      method: 'POST',
      redirect: 'manual',
      headers,
      body: payloadText,
    });

    if ([301, 302, 303, 307, 308].includes(response.status)) {
      const location = response.headers.get('location');
      if (!location) {
        return NextResponse.json(
          { ok: false, error: `Portal retornou redirect ${response.status}, mas não informou Location.` },
          { status: response.status },
        );
      }

      const redirectUrl = new URL(location, endpoint).toString();
      response = await fetch(redirectUrl, {
        method: 'POST',
        redirect: 'manual',
        headers,
        body: payloadText,
      });
    }

    const text = await response.text();
    let data: Record<string, unknown> = {};
    try {
      data = text ? JSON.parse(text) : {};
    } catch {
      data = { raw: text };
    }

    if (!response.ok) {
      const portalMessage = String(data.error ?? data.message ?? '');
      const portalDetail = typeof data.detail === 'string'
        ? data.detail
        : data.detail
          ? JSON.stringify(data.detail)
          : '';
      const radarDebug = JSON.stringify({
        endpoint,
        tokenConfigured: Boolean(token),
        tokenLength: token.length,
        portalStatus: response.status,
        redirectLocation: response.headers.get('location'),
      });
      const invalidSupabaseKey = /invalid api key/i.test(`${portalMessage} ${portalDetail}`);
      const friendlyError = response.status === 401 && !invalidSupabaseKey
        ? 'Não autorizado. Confira se PORTAL_DRAFT_TOKEN no Radar é igual ao RADAR_DRAFT_TOKEN/PORTAL_DRAFT_TOKEN no portal.'
        : invalidSupabaseKey
          ? 'Supabase recusou a chave de API do portal. Confira SUPABASE_SERVICE_ROLE_KEY e VITE_SUPABASE_URL na Vercel do portal.'
        : [portalMessage || `Portal retornou status ${response.status}.`, portalDetail].filter(Boolean).join(' Detalhe: ');
      return NextResponse.json(
        { ok: false, error: [friendlyError, portalDetail ? `Detalhe: ${portalDetail}` : '', `Radar: ${radarDebug}`].filter(Boolean).join(' ') },
        { status: response.status },
      );
    }

    return NextResponse.json({ ok: true, ...data });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro desconhecido';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
