import { NextResponse } from 'next/server';
import { hasDb } from '@/lib/db';
import { isValidIranMobile, normalizePhone } from '@/lib/checkout';
import { clientIp, isBlocked, recordFail } from '@/lib/rateLimit';
import { verifyCode } from '@/lib/auth/otp';
import { CUSTOMER_COOKIE, createCustomerSession, sessionCookieOptions } from '@/lib/auth/session';

export const dynamic = 'force-dynamic';

// Extra brute-force guard on top of the 5-guesses-per-code lock: 20 wrong codes per IP per 15 minutes.
const MAX_FAILS = 20;
const WINDOW_MS = 15 * 60 * 1000;

const MSG = {
  bad_request: 'درخواست نامعتبر است.',
  bad_mobile: 'شماره موبایل معتبر نیست.',
  bad_code: 'کد باید ۶ رقم باشد.',
  too_many: 'تعداد تلاش‌ها زیاد بود. چند دقیقه بعد دوباره امتحان کنید.',
  invalid: 'کد درست نیست یا منقضی شده.',
  unavailable: 'ورود فعلاً در دسترس نیست.',
} as const;

const NO_STORE = { 'Cache-Control': 'no-store' };
const fail = (error: string, status: number, extra: Record<string, unknown> = {}) =>
  NextResponse.json({ ok: false, error, ...extra }, { status, headers: NO_STORE });

// POST { mobile, code } -> logs the customer in (creates the account on the first login) and sets the session cookie.
export async function POST(req: Request) {
  if (!hasDb()) return fail(MSG.unavailable, 503);

  let body: any;
  try { body = await req.json(); } catch { return fail(MSG.bad_request, 400); }
  const mobile = normalizePhone(typeof body?.mobile === 'string' ? body.mobile.slice(0, 20) : '');
  const code = normalizePhone(typeof body?.code === 'string' ? body.code.slice(0, 20) : '');
  if (!isValidIranMobile(mobile)) return fail(MSG.bad_mobile, 400);
  if (!/^\d{6}$/.test(code)) return fail(MSG.bad_code, 400);

  const key = 'otp-verify:' + clientIp(req);
  if (isBlocked(key, MAX_FAILS)) return fail(MSG.too_many, 429);

  const r = await verifyCode(mobile, code);
  if (!r.ok) {
    recordFail(key, WINDOW_MS);
    await new Promise((res) => setTimeout(res, 400)); // slow down guessing
    const msg = r.attemptsLeft > 0 ? MSG.invalid + ' ' + r.attemptsLeft + ' تلاش دیگر باقی مانده.' : MSG.invalid + ' کد جدید بگیرید.';
    return fail(msg, 400, { attemptsLeft: r.attemptsLeft });
  }

  const token = await createCustomerSession(r.customerId);
  const res = NextResponse.json({ ok: true, isNew: r.isNew }, { headers: NO_STORE });
  res.cookies.set(CUSTOMER_COOKIE, token, sessionCookieOptions());
  return res;
}
