import { NextRequest, NextResponse } from 'next/server';
import { collectNews } from '@/lib/collectNews';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 60;

function resolveMode(req: NextRequest) {
  const mode = req.nextUrl.searchParams.get('mode');
  if (mode === 'full') return 'full' as const;
  if (mode === 'scheduled') return 'scheduled' as const;
  return 'quick' as const;
}

export async function POST(req: NextRequest) {
  try {
    const result = await collectNews({ mode: resolveMode(req) });
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro desconhecido';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
