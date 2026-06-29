import { NextRequest, NextResponse } from 'next/server';

const RADAR_SESSION_COOKIE = 'radar_session';

function isLoginRequired() {
  return process.env.RADAR_REQUIRE_LOGIN === 'true' || process.env.RADAR_MODE === 'private';
}

function expectedToken() {
  return process.env.RADAR_ADMIN_TOKEN || process.env.RADAR_ADMIN_PASSWORD || '';
}

function isPublicPath(pathname: string) {
  return (
    pathname === '/login' ||
    pathname.startsWith('/api/auth/') ||
    pathname.startsWith('/_next/') ||
    pathname === '/favicon.ico' ||
    pathname === '/robots.txt' ||
    pathname === '/sitemap.xml'
  );
}

export function middleware(req: NextRequest) {
  if (!isLoginRequired()) return NextResponse.next();

  const { pathname } = req.nextUrl;
  if (isPublicPath(pathname)) return NextResponse.next();

  const token = expectedToken();
  if (!token) {
    const loginUrl = new URL('/login', req.url);
    loginUrl.searchParams.set('error', 'missing_config');
    return NextResponse.redirect(loginUrl);
  }

  const session = req.cookies.get(RADAR_SESSION_COOKIE)?.value;
  if (session === token) return NextResponse.next();

  if (pathname.startsWith('/api/')) {
    return NextResponse.json({ ok: false, error: 'Login obrigatório.' }, { status: 401 });
  }

  const loginUrl = new URL('/login', req.url);
  loginUrl.searchParams.set('next', `${pathname}${req.nextUrl.search}`);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
