// Exemplo para o portal O Catarina, se ele for Next.js.
// Crie algo equivalente em app/api/radar/drafts/route.ts no repositório do portal.
// Ajuste nomes de tabela e colunas conforme o banco do portal.

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

function clean(value: string | undefined) {
  return (value ?? '').trim().replace(/^["']|["']$/g, '').trim();
}

export async function POST(req: NextRequest) {
  const expectedToken = clean(process.env.RADAR_DRAFT_TOKEN);
  const auth = req.headers.get('authorization') ?? '';
  const receivedToken = clean(auth.replace(/^Bearer\s+/i, ''));

  if (!expectedToken || receivedToken !== expectedToken) {
    return NextResponse.json({ ok: false, error: 'Não autorizado.' }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const title = String(body.title ?? '').trim();
  const excerpt = String(body.excerpt ?? '').trim();
  const content = String(body.content ?? '').trim();

  if (!title || !content) {
    return NextResponse.json({ ok: false, error: 'Título e conteúdo são obrigatórios.' }, { status: 400 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  );

  const { data, error } = await supabase
    .from('posts')
    .insert({
      title,
      excerpt,
      content,
      status: 'draft',
      category: body.category ?? null,
      city: body.city ?? null,
      source_url: body.sourceUrl ?? null,
      origin: body.origin ?? 'radar-sc-o-catarina',
    })
    .select('id')
    .single();

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    id: data.id,
    editUrl: `${process.env.NEXT_PUBLIC_SITE_URL ?? ''}/admin/posts/${data.id}`,
  });
}
