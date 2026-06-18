import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import type { NewsItem } from '@/lib/types';
import { buildStoryGroups, cutoffIsoForHours, getRecentHoursFromSearchParam } from '@/lib/storyGroups';
import { buildClippingReport, clippingActionFor, clippingActionLabel, hasOfficialSource } from '@/lib/clipping';
import { getSortFromParam, sortStoryGroups } from '@/lib/sort';
import { instagramPotentialForGroup, suggestedInstagramFormatForGroup } from '@/lib/instagram';

export const dynamic = 'force-dynamic';

function normalize(input: string) {
  return input.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

function matchesLocation(item: NewsItem, location?: string) {
  if (!location) return true;
  const wanted = normalize(location);
  const haystack = normalize(`${item.city ?? ''} ${item.region ?? ''} ${item.title ?? ''} ${item.summary ?? ''}`);
  return haystack.includes(wanted);
}

function csvEscape(value: unknown) {
  const text = value === null || value === undefined ? '' : String(value);
  return `"${text.replace(/"/g, '""')}"`;
}

export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams;
  const hours = getRecentHoursFromSearchParam(params.get('hours'));
  const sort = getSortFromParam(params.get('sort'));
  const city = params.get('city') || undefined;
  const region = params.get('region') || undefined;
  const topic = params.get('topic') || undefined;
  const location = city ?? region;
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from('news_items')
    .select('*')
    .gte('published_at', cutoffIsoForHours(hours))
    .neq('status', 'descartado')
    .order(sort === 'recente' ? 'published_at' : 'opportunity_score', { ascending: false })
    .order('published_at', { ascending: false })
    .limit(700);

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  const items = ((data ?? []) as NewsItem[])
    .filter((item) => matchesLocation(item, location))
    .filter((item) => !topic || item.topic === topic);
  const groups = sortStoryGroups(buildStoryGroups(items, 120), sort);
  const report = buildClippingReport(groups, items, hours);

  const headers = [
    'ordem', 'acao', 'titulo', 'cidade', 'regiao', 'tema', 'prioridade', 'urgencia', 'concorrencia', 'instagram', 'veiculacoes',
    'primeiro_meio', 'primeira_data', 'ultima_data', 'fonte_oficial_detectada', 'o_catarina_publicou', 'formato_instagram',
    'concorrentes', 'fontes', 'angulo', 'link_principal'
  ];

  const rows = report.topStories.map((group, index) => [
    index + 1,
    clippingActionLabel(clippingActionFor(group)),
    group.headline,
    group.city ?? '',
    group.region ?? '',
    group.topic ?? '',
    group.score,
    group.urgencyScore,
    group.competitionScore,
    instagramPotentialForGroup(group),
    group.mentions,
    group.firstSource ?? '',
    group.firstPublishedAt ?? '',
    group.latestPublishedAt ?? '',
    hasOfficialSource(group) ? 'sim' : 'não',
    group.items.some((item) => item.status === 'publicado') ? 'sim' : 'não',
    suggestedInstagramFormatForGroup(group),
    group.competitors.join(', '),
    group.sources.join(' | '),
    group.angle,
    group.leadItem.link,
  ]);

  const csv = [headers, ...rows].map((row) => row.map(csvEscape).join(',')).join('\n');
  return new NextResponse(csv, {
    headers: {
      'content-type': 'text/csv; charset=utf-8',
      'content-disposition': `attachment; filename="clipping-radar-sc-${hours}h.csv"`,
    },
  });
}
