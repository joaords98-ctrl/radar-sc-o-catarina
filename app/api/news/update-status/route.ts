import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import type { NewsStatus } from '@/lib/types';

const allowedStatus: NewsStatus[] = ['novo', 'reapurar', 'em_producao', 'publicado', 'descartado'];

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const id = String(body.id ?? '');
    const status = String(body.status ?? '') as NewsStatus;

    if (!id || !allowedStatus.includes(status)) {
      return NextResponse.json({ ok: false, error: 'Dados inválidos.' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    const { error } = await supabase
      .from('news_items')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro desconhecido';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
