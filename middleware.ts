import { NextRequest, NextResponse } from 'next/server';

export function middleware(req: NextRequest) {
  const password = process.env.RADAR_PASSWORD;
  const pathname = req.nextUrl.pathname;

  if (!password) return NextResponse.next();
  if (pathname.startsWith('/_next') || pathname.startsWith('/favicon') || pathname.startsWith('/api/cron')) {
    return NextResponse.next();
  }

  const auth = req.headers.get('authorization');
  if (auth?.startsWith('Basic ')) {
    const decoded = Buffer.from(auth.replace('Basic ', ''), 'base64').toString('utf8');
    const [user, pass] = decoded.split(':');
    if (user === 'admin' && pass === password) {
      return NextResponse.next();
    }
  }

  return new NextResponse('Acesso restrito ao Radar SC', {
    status: 401,
    headers: {
      'WWW-Authenticate': 'Basic realm="Radar SC"',
    },
  });
}

export const config = {
  matcher: ['/((?!api/cron|_next/static|_next/image|favicon.ico).*)'],
};
