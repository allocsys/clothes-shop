import { NextResponse } from 'next/server';
import { hasDb } from '@/lib/db';
import { getCurrentCustomer } from '@/lib/auth/session';

export const dynamic = 'force-dynamic';

// GET -> who is logged in on this browser (or null). The header and menu use it to show "My account" instead of "Log in".
export async function GET() {
  let customer = null;
  if (hasDb()) {
    try {
      const c = await getCurrentCustomer();
      if (c) customer = { mobile: c.mobile, name: c.name };
    } catch (e) {
      console.error('ME_ERROR', e);
    }
  }
  return NextResponse.json({ customer }, { headers: { 'Cache-Control': 'no-store' } });
}
