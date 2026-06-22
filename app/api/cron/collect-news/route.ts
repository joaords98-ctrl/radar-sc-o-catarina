import { NextRequest, NextResponse } from 'next/server';
import { collectNews } from '@/lib/collectNews';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 60;

function isAuthorized(req: NextRequest) {
  const cronHeader = req.headers.get('x-vercel-cron');
  if (cronHeader === '1') return true;

  const cronSecret = process.env.CRON_SECRET;
  const auth = req.headers.get('authorization');
  const secretFromUrl = req.nextUrl.searchParams.get('secret');

  if (cronSecret && (auth === `Bearer ${cronSecret}` || secretFromUrl === cronSecret)) {
    return true;
  }

  const panelPassword = process.env.RADAR_PASSWORD;
  if (panelPassword && auth?.startsWith('Basic ')) {
    try {
      const decoded = Buffer.from(auth.replace('Basic ', ''), 'base64').toString('utf8');
      const [user, pass] = decoded.split(':');
      return user === 'admin' && pass === panelPassword;
    } catch {
      return false;
    }
  }

  // Se nenhum segredo foi configurado, deixa aberto para facilitar testes locais.
  return !cronSecret && !panelPassword;
}

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json(
      {
        ok: false,
        error: 'Coleta não autorizada. Faça login no painel ou chame /api/cron/collect-news?secret=SEU_CRON_SECRET.',
      },
      { status: 401 },
    );
  }

  try {
    const result = await collectNews({ mode: 'scheduled' });
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro desconhecido';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
