import { NextResponse } from 'next/server';
import { RADAR_SESSION_COOKIE } from '@/lib/radarAccess';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(req: Request) {
  const url = new URL('/login', req.url);
  url.searchParams.set('logout', '1');

  const res = NextResponse.redirect(url, { status: 303 });
  res.cookies.set(RADAR_SESSION_COOKIE, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });
  return res;
}
