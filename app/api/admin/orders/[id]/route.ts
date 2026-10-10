import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/adminGuard';
import { changeStatus, isStatus } from '@/lib/adminOrders';
import { hasDb } from '@/lib/db';

export const dynamic = 'force-dynamic';

// PATCH /api/admin/orders/:id  { status: <new status>, from: <status the admin saw> }
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const denied = await requireAdmin();
  if (denied) return denied;
  if (!hasDb()) return NextResponse.json({ error: 'no_database' }, { status: 503 });

  const id = Number((await params).id);
  if (!Number.isInteger(id) || id <= 0) return NextResponse.json({ error: 'not_found' }, { status: 404 });

  const body = (await req.json().catch(() => null)) as { status?: unknown; from?: unknown } | null;
  if (!body || !isStatus(body.status) || !isStatus(body.from)) return NextResponse.json({ error: 'bad_request' }, { status: 400 });

  const res = await changeStatus(id, body.status, body.from);
  if (res.ok) return NextResponse.json({ ok: true, status: res.status, restocked: res.restocked });
  if (res.reason === 'not_found') return NextResponse.json({ error: 'not_found' }, { status: 404 });
  return NextResponse.json({ error: res.reason, current: res.current }, { status: 409 });
}
