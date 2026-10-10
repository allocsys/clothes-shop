import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/adminGuard';
import { updateProductBasics, validateBasics } from '@/lib/adminProducts';
import { hasDb } from '@/lib/db';

export const dynamic = 'force-dynamic';

// PATCH /api/admin/products/:id  { title, description, category, price, oldPrice, isActive }
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
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

  const checked = validateBasics(body);
  if (!checked.ok) return NextResponse.json({ error: 'invalid', errors: checked.errors }, { status: 400 });

  const product = await updateProductBasics(id, checked.value);
  if (!product) return NextResponse.json({ error: 'not_found' }, { status: 404 });
  return NextResponse.json({ ok: true, product });
}
