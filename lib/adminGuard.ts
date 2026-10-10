import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { ADMIN_COOKIE, verifySession } from '@/lib/adminAuth';

// Call at the top of every admin API handler. The middleware already blocks logged-out requests;
// this checks again inside the handler (defense in depth). Returns a 401 response when the caller is
// not logged in, or null when everything is fine:
//   const denied = await requireAdmin(); if (denied) return denied;
export async function requireAdmin(): Promise<NextResponse | null> {
  const token = (await cookies()).get(ADMIN_COOKIE)?.value;
  if (await verifySession(token)) return null;
  return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
}
