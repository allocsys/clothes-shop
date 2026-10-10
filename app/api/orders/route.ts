import { NextResponse } from 'next/server';
import { isValidIranMobile, normalizePhone, priceOrder, type OrderItem } from '@/lib/checkout';
import { hasDb } from '@/lib/db';
import { createOrder } from '@/lib/orders';
import { getProductsBySlugs } from '@/lib/products';
import { getActiveProvider, providerMisconfigured } from '@/lib/payments';
import { startPayment } from '@/lib/payments/service';
import { siteOrigin } from '@/lib/payments/origin';

export const dynamic = 'force-dynamic';

const text = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '');

export async function POST(req: Request) {
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'درخواست نامعتبر است.' }, { status: 400 });
  }

  const customer = {
    name: text(body?.customer?.name, 80),
    phone: normalizePhone(text(body?.customer?.phone, 20)),
    city: text(body?.customer?.city, 60),
    address: text(body?.customer?.address, 400),
    postalCode: text(body?.customer?.postalCode, 12),
    notes: text(body?.customer?.notes, 400),
  };

  if (!customer.name || !customer.city || !customer.address) {
    return NextResponse.json({ ok: false, error: 'نام، شهر و آدرس را کامل وارد کنید.' }, { status: 400 });
  }
  if (!isValidIranMobile(customer.phone)) {
    return NextResponse.json({ ok: false, error: 'شماره موبایل معتبر نیست (مثال: ۰۹۱۲۳۴۵۶۷۸۹).' }, { status: 400 });
  }

  const rawItems: unknown[] = Array.isArray(body?.items) ? body.items.slice(0, 50) : [];
  const wanted = (rawItems as any[]).map((it) => (typeof it?.slug === 'string' ? it.slug : '')).filter(Boolean);
  const products = await getProductsBySlugs(Array.from(new Set(wanted)));
  const items: OrderItem[] = [];
  for (const it of rawItems as any[]) {
    const p = products.find((x) => x.slug === it?.slug);
    const qty = Number(it?.qty);
    if (!p || !Number.isInteger(qty) || qty < 1 || qty > 10) continue;
    if (!p.sizes.includes(it.size) || !p.colors.includes(it.color)) continue;
    items.push({ slug: p.slug, size: it.size, color: it.color, qty });
  }
  if (items.length === 0) {
    return NextResponse.json({ ok: false, error: 'سبد خرید خالی یا نامعتبر است.' }, { status: 400 });
  }

  const totals = priceOrder(items, products);
  // With a database: save the order and reduce stock in one transaction.
  if (hasDb()) {
    let result;
    try {
      result = await createOrder(customer, items, products, totals, { payOnline: getActiveProvider() !== null });
    } catch (e) {
      console.error('ORDER_FAILED', e);
      return NextResponse.json({ ok: false, error: 'ثبت سفارش انجام نشد. لطفاً دوباره تلاش کنید.' }, { status: 500 });
    }
    if (!result.ok) {
      const msg =
        result.available > 0
          ? `از «${result.title}» (سایز ${result.size}، رنگ ${result.color}) فقط ${result.available} عدد موجود است.`
          : `«${result.title}» (سایز ${result.size}، رنگ ${result.color}) ناموجود شد.`;
      return NextResponse.json({ ok: false, error: msg, outOfStock: true }, { status: 409 });
    }
    // Online payment on: start it right away and send the customer to the gateway.
    // If the gateway cannot be reached the order still exists; the customer can pay later from /order/<code>.
    if (providerMisconfigured()) console.error('PAYMENT_PROVIDER is set but unknown or not allowed here: online payment is OFF');
    if (getActiveProvider()) {
      const pay = await startPayment(result.code, customer.phone, siteOrigin(req)).catch(() => null);
      if (pay?.ok) return NextResponse.json({ ok: true, code: result.code, ...totals, payUrl: pay.redirectUrl });
      return NextResponse.json({ ok: true, code: result.code, ...totals, payError: true });
    }
    return NextResponse.json({ ok: true, code: result.code, ...totals });
  }

  // No database (static fallback): the order is only written to the server log.
  const code = 'MP-' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).slice(2, 5).toUpperCase();
  console.log('NEW_ORDER ' + JSON.stringify({ code, createdAt: new Date().toISOString(), customer, items, ...totals }));

  return NextResponse.json({ ok: true, code, ...totals });
}
