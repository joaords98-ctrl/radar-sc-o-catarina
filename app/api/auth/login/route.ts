import { NextRequest, NextResponse } from 'next/server';
import { RADAR_SESSION_COOKIE, getRadarSessionToken, normalizeRadarSecret } from '@/lib/radarAccess';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const form = await req.formData();
  const password = normalizeRadarSecret(String(form.get('password') ?? ''));
  const next = String(form.get('next') ?? '/') || '/';
  const expectedPassword = normalizeRadarSecret(process.env.RADAR_ADMIN_PASSWORD || process.env.RADAR_ADMIN_TOKEN || '');
  const sessionToken = getRadarSessionToken();

  if (!expectedPassword || !sessionToken) {
    const url = new URL('/login', req.url);
    url.searchParams.set('error', 'missing_config');
    return NextResponse.redirect(url, { status: 303 });
  }

  if (password !== expectedPassword) {
    const url = new URL('/login', req.url);
    url.searchParams.set('error', 'invalid');
    if (next) url.searchParams.set('next', next);
    return NextResponse.redirect(url, { status: 303 });
  }

  const redirectUrl = new URL(next.startsWith('/') ? next : '/', req.url);
  const res = NextResponse.redirect(redirectUrl, { status: 303 });
  res.cookies.set(RADAR_SESSION_COOKIE, sessionToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  });
  return res;
}
