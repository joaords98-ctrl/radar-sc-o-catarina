import { NextResponse } from 'next/server';
import { runActiveSearch } from '@/lib/activeSearch';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const result = await runActiveSearch({
      q: typeof body.q === 'string' ? body.q : '',
      city: typeof body.city === 'string' && body.city ? body.city : null,
      region: typeof body.region === 'string' && body.region ? body.region : null,
      topic: typeof body.topic === 'string' && body.topic ? body.topic : null,
      hours: Number(body.hours || 24),
      limit: Number(body.limit || 30),
    });

    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro desconhecido';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
