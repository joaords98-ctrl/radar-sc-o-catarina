import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

function cleanEndpoint(value: string | undefined) {
  return (value ?? '').trim().replace(/^["']|["']$/g, '').trim();
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
    const content = String(body.content ?? '').trim();

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
      sourceUrl: body.sourceUrl ?? null,
      origin: 'radar-sc-o-catarina',
    };

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(payload),
    });

    const text = await response.text();
    let data: Record<string, unknown> = {};
    try {
      data = text ? JSON.parse(text) : {};
    } catch {
      data = { raw: text };
    }

    if (!response.ok) {
      const portalMessage = String(data.error ?? data.message ?? '');
      const friendlyError = response.status === 401
        ? 'Não autorizado. Confira se PORTAL_DRAFT_TOKEN no Radar é igual ao RADAR_DRAFT_TOKEN/PORTAL_DRAFT_TOKEN no portal.'
        : portalMessage || `Portal retornou status ${response.status}.`;
      return NextResponse.json(
        { ok: false, error: friendlyError },
        { status: response.status },
      );
    }

    return NextResponse.json({ ok: true, ...data });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro desconhecido';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
