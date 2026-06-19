import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const newsId = String(body.newsId ?? '');
    const storyKey = typeof body.storyKey === 'string' ? body.storyKey : null;
    const headline = typeof body.headline === 'string' ? body.headline : null;

    if (!newsId) {
      return NextResponse.json({ ok: false, error: 'Notícia inválida.' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    const { data: existing, error: existingError } = await supabase
      .from('editorial_tasks')
      .select('id')
      .eq('news_item_id', newsId)
      .in('status', ['pendente', 'fazendo'])
      .limit(1);

    if (existingError) throw existingError;

    let taskId = existing?.[0]?.id ?? null;

    if (!taskId) {
      const notesParts = [
        storyKey ? `story:${storyKey}` : null,
        headline ? `headline:${headline}` : null,
      ].filter(Boolean);

      const { data: inserted, error: insertError } = await supabase
        .from('editorial_tasks')
        .insert({
          news_item_id: newsId,
          task_type: 'pauta_editorial',
          status: 'pendente',
          notes: notesParts.join('\n') || null,
        })
        .select('id')
        .single();

      if (insertError) throw insertError;
      taskId = inserted?.id ?? null;
    }

    const { error: updateError } = await supabase
      .from('news_items')
      .update({ status: 'em_producao', updated_at: new Date().toISOString() })
      .eq('id', newsId);

    if (updateError) throw updateError;

    return NextResponse.json({ ok: true, taskId });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro desconhecido';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
