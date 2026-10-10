import { NextResponse } from 'next/server';
import { hasDb } from '@/lib/db';
import { isValidIranMobile, normalizePhone } from '@/lib/checkout';
import { clientIp, isBlocked, recordFail } from '@/lib/rateLimit';
import { CODE_TTL_MINUTES, RESEND_SECONDS, discardCode, requestCode } from '@/lib/auth/otp';
import { sendSms } from '@/lib/sms/service';
import { loginCodeText } from '@/lib/sms/templates';

export const dynamic = 'force-dynamic';

// Guard against someone using the shop to spam SMS: 10 code requests per IP per 15 minutes
// (on top of the per-mobile limits inside requestCode).
const MAX_REQUESTS = 10;
const WINDOW_MS = 15 * 60 * 1000;

const MSG = {
  bad_request: 'درخواست نامعتبر است.',
  bad_mobile: 'شماره موبایل معتبر نیست (مثال: ۰۹۱۲۳۴۵۶۷۸۹).',
  too_many: 'تعداد درخواست‌ها زیاد بود. کمی بعد دوباره امتحان کنید.',
  sms_off: 'ورود با پیامک فعلاً در دسترس نیست.',
  sms_failed: 'ارسال پیامک انجام نشد. دوباره امتحان کنید.',
  unavailable: 'ورود فعلاً در دسترس نیست.',
} as const;

const NO_STORE = { 'Cache-Control': 'no-store' };
const fail = (error: string, status: number, extra: Record<string, unknown> = {}) =>
  NextResponse.json({ ok: false, error, ...extra }, { status, headers: NO_STORE });

// POST { mobile } -> sends a 6-digit code by SMS. The answer never says whether the number already has an account.
export async function POST(req: Request) {
  if (!hasDb()) return fail(MSG.unavailable, 503);

  let body: any;
  try { body = await req.json(); } catch { return fail(MSG.bad_request, 400); }
  const mobile = normalizePhone(typeof body?.mobile === 'string' ? body.mobile.slice(0, 20) : '');
  if (!isValidIranMobile(mobile)) return fail(MSG.bad_mobile, 400);

  const key = 'otp-request:' + clientIp(req);
  if (isBlocked(key, MAX_REQUESTS)) return fail(MSG.too_many, 429);
  recordFail(key, WINDOW_MS); // every request counts, not only failures

  const r = await requestCode(mobile);
  if (!r.ok) {
    if (r.reason === 'cooldown') {
      return fail('کد قبلی تازه ارسال شده. ' + r.waitSeconds + ' ثانیه دیگر دوباره امتحان کنید.', 429, { waitSeconds: r.waitSeconds });
    }
    return fail(MSG.too_many, 429);
  }

  const out = await sendSms({
    kind: 'login_code',
    to: mobile,
    text: loginCodeText({ code: r.code, minutes: CODE_TTL_MINUTES }),
    logText: '[کد ورود - ذخیره نمی‌شود]',
  });
  if (out.status !== 'sent') {
    await discardCode(r.id); // nothing arrived, so do not make the customer wait for the cooldown
    return out.status === 'skipped' && out.reason === 'off' ? fail(MSG.sms_off, 503) : fail(MSG.sms_failed, 502);
  }
  return NextResponse.json({ ok: true, resendSeconds: RESEND_SECONDS, expiresMinutes: CODE_TTL_MINUTES }, { headers: NO_STORE });
}
