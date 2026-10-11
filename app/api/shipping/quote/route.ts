import { NextResponse } from 'next/server';
import { isProvince } from '@/data/provinces';
import { getProductsBySlugs } from '@/lib/products';
import { CARRIER_LABELS, quoteForCart } from '@/lib/shipping';

export const dynamic = 'force-dynamic';

// The cart page asks here what shipping costs for the chosen province.
// Prices and weights always come from our own product data, never from the browser.
export async function POST(req: Request) {
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'درخواست نامعتبر است.' }, { status: 400 });
  }
  if (!isProvince(body?.province)) {
    return NextResponse.json({ ok: false, error: 'استان را انتخاب کنید.' }, { status: 400 });
  }

  const raw: any[] = Array.isArray(body?.items) ? body.items.slice(0, 50) : [];
  const wanted = Array.from(new Set(raw.map((it) => (typeof it?.slug === 'string' ? it.slug : '')).filter(Boolean)));
  const products = await getProductsBySlugs(wanted);
  const items: { slug: string; qty: number }[] = [];
  for (const it of raw) {
    const p = products.find((x) => x.slug === it?.slug);
    const qty = Number(it?.qty);
    if (!p || !Number.isInteger(qty) || qty < 1 || qty > 10) continue;
    items.push({ slug: p.slug, qty });
  }
  if (items.length === 0) {
    return NextResponse.json({ ok: false, error: 'سبد خرید خالی یا نامعتبر است.' }, { status: 400 });
  }

  const q = await quoteForCart(items, products, body.province);
  return NextResponse.json({
    ok: true,
    subtotal: q.subtotal,
    shipping: q.shipping,
    total: q.subtotal + q.shipping,
    free: q.free,
    carrier: q.carrier,
    carrierLabel: CARRIER_LABELS[q.carrier],
    weightG: q.weightG,
  });
}
