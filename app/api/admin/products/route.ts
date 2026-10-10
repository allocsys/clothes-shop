import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/adminGuard';
import { createProduct, validateBasics } from '@/lib/adminProducts';
import { validateVariants } from '@/lib/adminVariants';
import { hasDb } from '@/lib/db';

export const dynamic = 'force-dynamic';

// POST /api/admin/products  { title, description, category, price, oldPrice, isActive, variants: [{ size, color, stock }] }
export async function POST(req: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;
  if (!hasDb()) return NextResponse.json({ error: 'no_database' }, { status: 503 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'bad_request' }, { status: 400 });
  }

  const basics = validateBasics(body);
  if (!basics.ok) return NextResponse.json({ error: 'invalid', errors: basics.errors }, { status: 400 });
  const variants = validateVariants(body);
  if (!variants.ok) return NextResponse.json({ error: 'invalid', message: variants.error }, { status: 400 });

  const product = await createProduct(
    basics.value,
    variants.value.map(({ size, color, stock }) => ({ size, color, stock })),
  );
  return NextResponse.json({ ok: true, product }, { status: 201 });
}
