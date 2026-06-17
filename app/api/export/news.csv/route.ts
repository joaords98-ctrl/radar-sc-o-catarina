import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { getRecentCutoffIso } from '@/lib/recent';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

function csvEscape(value: unknown) {
  if (value === null || value === undefined) return '';
  const text = String(value).replace(/\r?\n|\r/g, ' ').trim();
  if (/[",;]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
  return text;
}

function isAuthorized(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  const secretFromUrl = req.nextUrl.searchParams.get('secret');
  const auth = req.headers.get('authorization');

  if (cronSecret && (secretFromUrl === cronSecret || auth === `Bearer ${cronSecret}`)) return true;

  const panelPassword = process.env.RADAR_PASSWORD;
  if (panelPassword && auth?.startsWith('Basic ')) {
    try {
      const decoded = Buffer.from(auth.replace('Basic ', ''), 'base64').toString('utf8');
      const [user, pass] = decoded.split(':');
      return user === 'admin' && pass === panelPassword.trim();
    } catch {
      return false;
    }
  }

  return !cronSecret && !panelPassword;
}

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ ok: false, error: 'Exportação não autorizada.' }, { status: 401 });
  }

  const supabase = getSupabaseAdmin();
  const daysParam = Number(req.nextUrl.searchParams.get('days') ?? '1');
  const hours = Number.isFinite(daysParam) && daysParam > 1 ? Math.min(daysParam, 30) * 24 : undefined;
  const cutoffIso = getRecentCutoffIso(hours);

  const { data, error } = await supabase
    .from('news_items')
    .select('title,link,source_name,source_domain,published_at,query_label,topic,city,region,opportunity_score,media_repercussion_score,media_mentions_count,top_media_sources,competitor_hits_count,competitor_names,status,angle,summary')
    .gte('published_at', cutoffIso)
    .neq('status', 'descartado')
    .order('opportunity_score', { ascending: false })
    .order('published_at', { ascending: false })
    .limit(500);

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  const headers = ['title','link','source_name','source_domain','published_at','query_label','topic','city','region','opportunity_score','media_repercussion_score','media_mentions_count','top_media_sources','competitor_hits_count','competitor_names','status','angle','summary'];
  const rows = [headers.join(';')];

  for (const item of data ?? []) {
    rows.push(headers.map((key) => {
      const value = (item as Record<string, unknown>)[key];
      return csvEscape(Array.isArray(value) ? value.join(' · ') : value);
    }).join(';'));
  }

  return new NextResponse(rows.join('\n'), {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="radar-sc-noticias.csv"',
    },
  });
}
