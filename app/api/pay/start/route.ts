import { NextResponse } from 'next/server';
import { normalizePhone } from '@/lib/checkout';
import { startPayment } from '@/lib/payments/service';
import { siteOrigin } from '@/lib/payments/origin';

export const dynamic = 'force-dynamic';

const MSG = {
  disabled: 'پرداخت آنلاین فعلاً فعال نیست.',
  not_found: 'سفارشی با این کد و شماره موبایل پیدا نشد.',
  not_payable: 'این سفارش قابل پرداخت نیست.',
  already_paid: 'این سفارش قبلاً پرداخت شده است.',
  gateway_error: 'اتصال به درگاه برقرار نشد. کمی بعد دوباره تلاش کنید.',
} as const;

// Pay (again) for an existing order. Needs the order code AND the mobile number used for it.
export async function POST(req: Request) {
  let body: any;
  try { body = await req.json(); } catch { return NextResponse.json({ ok: false, error: 'درخواست نامعتبر است.' }, { status: 400 }); }
  const code = typeof body?.code === 'string' ? body.code.trim().toUpperCase().slice(0, 20) : '';
  const mobile = normalizePhone(typeof body?.mobile === 'string' ? body.mobile.slice(0, 20) : '');
  if (!code || !mobile) return NextResponse.json({ ok: false, error: MSG.not_found }, { status: 400 });

  const r = await startPayment(code, mobile, siteOrigin(req));
  if (!r.ok) return NextResponse.json({ ok: false, error: MSG[r.reason] }, { status: r.reason === 'gateway_error' ? 502 : 400 });
  return NextResponse.json({ ok: true, payUrl: r.redirectUrl });
}
