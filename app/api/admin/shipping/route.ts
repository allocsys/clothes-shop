import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/adminGuard';
import { saveShippingSettings } from '@/lib/adminShipping';

export const dynamic = 'force-dynamic';

// PUT /api/admin/shipping  { carrier, packagingG, rates: { <carrier>: { <zone>: { fees: [4 numbers|null], extraPerKg } } } }
export async function PUT(req: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const body = await req.json().catch(() => null);
  const res = await saveShippingSettings(body);
  if (res.ok) return NextResponse.json({ ok: true });
  if (res.error === 'no_database') return NextResponse.json({ error: res.error }, { status: 503 });
  if (res.error === 'server') return NextResponse.json({ error: res.error }, { status: 500 });
  return NextResponse.json({ error: res.error, carrier: res.carrier, zone: res.zone }, { status: 400 });
}
