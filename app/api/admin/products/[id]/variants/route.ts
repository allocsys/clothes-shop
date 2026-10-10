import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/adminGuard';
import { saveVariants, validateVariants } from '@/lib/adminVariants';
import { hasDb } from '@/lib/db';

export const dynamic = 'force-dynamic';

// PUT /api/admin/products/:id/variants  { variants: [{ size, color, stock, loaded }] }  (the full list)
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const denied = await requireAdmin();
  if (denied) return denied;
  if (!hasDb()) return NextResponse.json({ error: 'no_database' }, { status: 503 });

  const id = Number((await params).id);
  if (!Number.isInteger(id) || id <= 0) return NextResponse.json({ error: 'not_found' }, { status: 404 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'bad_request' }, { status: 400 });
  }
  const checked = validateVariants(body);
  if (!checked.ok) return NextResponse.json({ error: 'invalid', message: checked.error }, { status: 400 });

  const res = await saveVariants(id, checked.value);
  if (!res.ok) {
    if (res.reason === 'not_found') return NextResponse.json({ error: 'not_found' }, { status: 404 });
    return NextResponse.json({ error: 'conflict', label: res.label }, { status: 409 });
  }
  return NextResponse.json({ ok: true, variants: res.variants });
}
