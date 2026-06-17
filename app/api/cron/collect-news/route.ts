import { NextRequest, NextResponse } from 'next/server';
import { collectNews } from '@/lib/collectNews';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

function isAuthorized(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true;

  const auth = req.headers.get('authorization');
  const cronHeader = req.headers.get('x-vercel-cron');

  return auth === `Bearer ${secret}` || cronHeader === '1';
}

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ ok: false, error: 'Cron não autorizado.' }, { status: 401 });
  }

  try {
    const result = await collectNews();
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro desconhecido';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
