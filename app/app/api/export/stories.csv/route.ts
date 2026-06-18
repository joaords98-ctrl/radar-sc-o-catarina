import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import type { NewsItem } from '@/lib/types';
import { buildStoryGroups, cutoffIsoForHours } from '@/lib/storyGroups';

export const dynamic = 'force-dynamic';

function csvEscape(value: unknown) {
  const text = value === null || value === undefined ? '' : String(value);
  return `"${text.replace(/"/g, '""')}"`;
}

export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get('secret');
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && secret !== cronSecret) {
    return NextResponse.json({ ok: false, error: 'Exportação não autorizada.' }, { status: 401 });
  }

  const hours = Number(req.nextUrl.searchParams.get('hours') ?? process.env.RADAR_RECENT_HOURS ?? 24);
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('news_items')
    .select('*')
    .gte('published_at', cutoffIsoForHours(Number.isFinite(hours) ? hours : 24))
    .neq('status', 'descartado')
    .order('opportunity_score', { ascending: false })
    .limit(400);

  if (error) throw error;
  const groups = buildStoryGroups((data ?? []) as NewsItem[], 100);
  const headers = ['prioridade','urgencia','concorrencia','risco','formato','mencoes','pauta','tema','cidade','primeiro_meio','concorrentes','fontes','acao','angulo','link_principal'];
  const rows = groups.map((g) => [
    g.score,
    g.urgencyScore,
    g.competitionScore,
    g.riskLevel,
    g.suggestedFormat,
    g.mentions,
    g.headline,
    g.topic ?? '',
    g.city ?? g.region ?? 'SC',
    g.firstSource ?? '',
    g.competitors.join(' | '),
    g.sources.join(' | '),
    g.action,
    g.angle,
    g.leadItem.link,
  ]);

  const csv = [headers, ...rows].map((row) => row.map(csvEscape).join(',')).join('\n');
  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="radar-sc-pautas.csv"',
    },
  });
}
