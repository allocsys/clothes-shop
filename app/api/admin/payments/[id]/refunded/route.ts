import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/adminGuard';
import { markRefunded } from '@/lib/adminPayments';
import { hasDb } from '@/lib/db';

export const dynamic = 'force-dynamic';

// POST /api/admin/payments/:id/refunded  (the admin already returned the money by hand)
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const denied = await requireAdmin();
  if (denied) return denied;
  if (!hasDb()) return NextResponse.json({ error: 'no_database' }, { status: 503 });
  const id = Number((await params).id);
  if (!Number.isInteger(id) || id <= 0) return NextResponse.json({ error: 'not_found' }, { status: 404 });
  const res = await markRefunded(id);
  return res.ok ? NextResponse.json({ ok: true }) : NextResponse.json({ error: res.reason }, { status: 409 });
}
