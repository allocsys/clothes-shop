import { NextResponse } from 'next/server';
import { hasDb } from '@/lib/db';
import { isValidIranMobile, normalizePhone } from '@/lib/checkout';
import { isOrderCode, normalizeOrderCode } from '@/lib/orderCode';
import { trackOrder } from '@/lib/orderTracking';
import { clientIp, isBlocked, recordFail } from '@/lib/rateLimit';

export const dynamic = 'force-dynamic';

// Brute-force guard: 8 wrong code+mobile pairs per IP per 15 minutes.
const MAX_FAILS = 8;
const WINDOW_MS = 15 * 60 * 1000;

const MSG = {
  bad_request: 'درخواست نامعتبر است.',
  bad_code: 'کد پیگیری درست نیست (مثال: MP-AB12CD34).',
  bad_mobile: 'شماره موبایل معتبر نیست (مثال: ۰۹۱۲۳۴۵۶۷۸۹).',
  not_found: 'سفارشی با این کد و شماره موبایل پیدا نشد.',
  too_many: 'تعداد تلاش‌ها زیاد بود. چند دقیقه بعد دوباره امتحان کنید.',
  unavailable: 'پیگیری سفارش فعلاً در دسترس نیست.',
} as const;

const NO_STORE = { 'Cache-Control': 'no-store' };
const fail = (error: string, status: number) => NextResponse.json({ ok: false, error }, { status, headers: NO_STORE });

// POST { code, mobile } -> the order's status page data, only when BOTH match.
export async function POST(req: Request) {
  if (!hasDb()) return fail(MSG.unavailable, 503);

  let body: any;
  try { body = await req.json(); } catch { return fail(MSG.bad_request, 400); }
  const code = normalizeOrderCode(typeof body?.code === 'string' ? body.code.slice(0, 30) : '');
  const mobile = normalizePhone(typeof body?.mobile === 'string' ? body.mobile.slice(0, 20) : '');
  if (!isOrderCode(code)) return fail(MSG.bad_code, 400);
  if (!isValidIranMobile(mobile)) return fail(MSG.bad_mobile, 400);

  const key = 'track:' + clientIp(req);
  if (isBlocked(key, MAX_FAILS)) return fail(MSG.too_many, 429);

  const order = await trackOrder(code, mobile);
  if (!order) {
    recordFail(key, WINDOW_MS);
    await new Promise((r) => setTimeout(r, 400)); // slow down guessing
    return fail(MSG.not_found, 404);
  }
  return NextResponse.json({ ok: true, order }, { headers: NO_STORE });
}
