import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import type { NewsStatus } from '@/lib/types';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const taskStatuses = ['pendente', 'fazendo', 'feito', 'cancelado'];
const newsStatuses: NewsStatus[] = ['novo', 'reapurar', 'em_producao', 'publicado', 'descartado'];

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const taskId = String(body.taskId ?? '');
    const newsId = typeof body.newsId === 'string' ? body.newsId : null;
    const taskStatus = String(body.taskStatus ?? '');
    const newsStatus = typeof body.newsStatus === 'string' ? body.newsStatus as NewsStatus : null;

    if (!taskId || !taskStatuses.includes(taskStatus)) {
      return NextResponse.json({ ok: false, error: 'Status de pauta inválido.' }, { status: 400 });
    }
    if (newsStatus && !newsStatuses.includes(newsStatus)) {
      return NextResponse.json({ ok: false, error: 'Status de notícia inválido.' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    const { error: taskError } = await supabase
      .from('editorial_tasks')
      .update({ status: taskStatus })
      .eq('id', taskId);

    if (taskError) throw taskError;

    if (newsId && newsStatus) {
      const { error: newsError } = await supabase
        .from('news_items')
        .update({ status: newsStatus, updated_at: new Date().toISOString() })
        .eq('id', newsId);

      if (newsError) throw newsError;
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro desconhecido';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
