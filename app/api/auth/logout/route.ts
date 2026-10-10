import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { hasDb } from '@/lib/db';
import { CUSTOMER_COOKIE, deleteCustomerSession } from '@/lib/auth/session';

export const dynamic = 'force-dynamic';

// POST -> ends this browser's session (in the database too) and clears the cookie.
export async function POST() {
  const token = (await cookies()).get(CUSTOMER_COOKIE)?.value;
  if (hasDb()) await deleteCustomerSession(token).catch(() => {});
  const res = NextResponse.json({ ok: true }, { headers: { 'Cache-Control': 'no-store' } });
  res.cookies.set(CUSTOMER_COOKIE, '', { path: '/', maxAge: 0 });
  return res;
}
