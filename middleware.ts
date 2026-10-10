import { NextResponse, type NextRequest } from 'next/server';
import { ADMIN_COOKIE, verifySession } from '@/lib/adminAuth';

// Locks everything under /admin and /api/admin (except the login page and login API)
// behind the admin session cookie. Route handlers should still call verifySession themselves later
// when they do something sensitive (defense in depth).
export const config = { matcher: ['/admin/:path*', '/api/admin/:path*'] };

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (pathname === '/admin/login' || pathname === '/api/admin/login') return NextResponse.next();

  if (await verifySession(req.cookies.get(ADMIN_COOKIE)?.value)) {
    const res = NextResponse.next();
    res.headers.set('Cache-Control', 'no-store');
    return res;
  }

  if (pathname.startsWith('/api/')) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const url = req.nextUrl.clone();
  url.pathname = '/admin/login';
  url.search = '';
  return NextResponse.redirect(url);
}
