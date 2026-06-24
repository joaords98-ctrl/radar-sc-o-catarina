import { NextResponse } from 'next/server';
import { runActiveSearchSafe } from '@/lib/activeSearch';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 20;

function timeoutResult(ms: number) {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        ok: true,
        safeMode: true,
        timedOutSafely: true,
        finalQuery: 'Busca segura encerrada antes do limite.',
        inserted: 0,
        updated: 0,
        skipped: 0,
        skippedOutOfState: 0,
        skippedNoScContext: 0,
        stoppedEarly: true,
        items: [],
        warning: 'A busca demorou demais e foi encerrada com segurança. Use uma busca mais específica ou rode a coleta pesada.',
      });
    }, ms);
  });
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));

    const payload = {
      q: typeof body.q === 'string' ? body.q : '',
      city: typeof body.city === 'string' && body.city ? body.city : null,
      region: typeof body.region === 'string' && body.region ? body.region : null,
      topic: typeof body.topic === 'string' && body.topic ? body.topic : null,
      hours: Number(body.hours || 72),
      limit: Number(body.limit || 20),
    };

    const result = await Promise.race([
      runActiveSearchSafe(payload),
      timeoutResult(14_000),
    ]);

    return NextResponse.json({ ok: true, ...(result as Record<string, unknown>) }, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro desconhecido';
    return NextResponse.json({ ok: false, error: message }, { status: 200 });
  }
}
