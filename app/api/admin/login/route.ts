import { NextResponse, type NextRequest } from 'next/server';
import { ADMIN_COOKIE, SESSION_SECONDS, adminEnabled, checkPassword, createSession } from '@/lib/adminAuth';

// POST { password } -> sets the admin session cookie.
// Brute-force guard: 5 wrong passwords per IP per 15 minutes (in memory, fine for one server).
const MAX_FAILS = 5;
const WINDOW_MS = 15 * 60 * 1000;
const g = globalThis as unknown as { __adminFails?: Map<string, { count: number; resetAt: number }> };
const fails = (g.__adminFails ??= new Map());

function clientIp(req: NextRequest): string {
  return req.headers.get('x-forwarded-for')?.split(',')[0].trim() || req.headers.get('x-real-ip') || 'unknown';
}

export async function POST(req: NextRequest) {
  if (!adminEnabled()) {
    return NextResponse.json({ error: 'not_configured' }, { status: 503 });
  }

  const ip = clientIp(req);
  const now = Date.now();
  const entry = fails.get(ip);
  if (entry && entry.resetAt > now && entry.count >= MAX_FAILS) {
    return NextResponse.json({ error: 'too_many' }, { status: 429 });
  }

  let password = '';
  try {
    const body = await req.json();
    if (typeof body?.password === 'string') password = body.password.slice(0, 200);
  } catch {
    return NextResponse.json({ error: 'bad_request' }, { status: 400 });
  }

  if (!(await checkPassword(password))) {
    const e = entry && entry.resetAt > now ? entry : { count: 0, resetAt: now + WINDOW_MS };
    e.count += 1;
    fails.set(ip, e);
    await new Promise((r) => setTimeout(r, 500)); // slow down guessing
    return NextResponse.json({ error: 'wrong_password' }, { status: 401 });
  }

  fails.delete(ip);
  const token = await createSession();
  if (!token) return NextResponse.json({ error: 'not_configured' }, { status: 503 });

  const https = req.nextUrl.protocol === 'https:' || req.headers.get('x-forwarded-proto') === 'https';
  const res = NextResponse.json({ ok: true });
  res.cookies.set(ADMIN_COOKIE, token, {
    httpOnly: true,
    sameSite: 'strict',
    secure: https,
    path: '/',
    maxAge: SESSION_SECONDS,
  });
  return res;
}
