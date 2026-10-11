import type { PaymentProvider } from './types';
import { postJson } from './http';

// Zarinpal (zarinpal.com) REST API v4. Docs: https://www.zarinpal.com/docs/paymentGateway/connectToGateway
//
// Flow: request -> Authority; send the customer to /pg/StartPay/<Authority>; the customer comes back to our
// callback with ?Authority=...&Status=OK|NOK; we then call verify (with OUR amount) and only then count it as paid.
//
// Env: ZARINPAL_MERCHANT_ID (36-character id from the Zarinpal panel; required)
//      ZARINPAL_BASE_URL    (optional; default https://payment.zarinpal.com, sandbox: https://sandbox.zarinpal.com)
// The callback address must be on the domain registered for this merchant id in the Zarinpal panel.
// Amounts: the shop uses Toman, this gateway wants Rial, so we multiply by 10 here and nowhere else.

const MERCHANT_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const AUTHORITY_RE = /^[A-Za-z0-9]{10,64}$/;
// Answers that mean "this payment definitely did not succeed". Any OTHER unexpected code is thrown instead,
// so the payment stays 'started' and can be re-checked, rather than being marked failed for good.
const DEFINITE_FAIL = new Set([-50, -51, -53, -54]);

const baseUrl = () => (process.env.ZARINPAL_BASE_URL ?? '').trim().replace(/\/+$/, '') || 'https://payment.zarinpal.com';
const merchantId = () => (process.env.ZARINPAL_MERCHANT_ID ?? '').trim();

// Used by index.ts: without a valid merchant id this gateway counts as "not available" (misconfigured warning).
export function zarinpalConfigured(): boolean {
  return MERCHANT_RE.test(merchantId());
}

type Answer = { data?: unknown; errors?: unknown };
type Data = { code?: number; authority?: string; ref_id?: number | string; card_pan?: string };

// Zarinpal answers data=[] on errors and errors=[] on success, so both can be arrays: read them defensively.
function read(answer: unknown): { code: number | null; data: Data } {
  const a = (answer ?? {}) as Answer;
  const data = a.data && !Array.isArray(a.data) && typeof a.data === 'object' ? (a.data as Data) : {};
  const err = a.errors && !Array.isArray(a.errors) && typeof a.errors === 'object' ? (a.errors as { code?: number }) : {};
  const code = typeof data.code === 'number' ? data.code : typeof err.code === 'number' ? err.code : null;
  return { code, data };
}

export const zarinpalProvider: PaymentProvider = {
  id: 'zarinpal',
  label: 'زرین‌پال',

  async start({ orderCode, amount, mobile, description, callbackUrl }) {
    const answer = await postJson(baseUrl() + '/pg/v4/payment/request.json', {
      merchant_id: merchantId(),
      amount: amount * 10,
      callback_url: callbackUrl,
      description,
      metadata: { mobile, order_id: orderCode },
    });
    const { code, data } = read(answer);
    if (code !== 100 || !data.authority || !AUTHORITY_RE.test(data.authority)) {
      throw new Error('zarinpal request refused, code ' + code);
    }
    return { reference: data.authority, redirectUrl: baseUrl() + '/pg/StartPay/' + data.authority };
  },

  parseCallback(cb) {
    const reference = cb.Authority && AUTHORITY_RE.test(cb.Authority) ? cb.Authority : null;
    return { reference, cancelled: cb.Status !== 'OK' };
  },

  async verify({ reference, amount, callback }) {
    if (callback.Status !== 'OK') return { ok: false, error: 'پرداخت لغو شد' };
    const answer = await postJson(baseUrl() + '/pg/v4/payment/verify.json', {
      merchant_id: merchantId(),
      amount: amount * 10, // OUR amount from the database, never from the callback
      authority: reference,
    });
    const { code, data } = read(answer);
    // 100 = verified now, 101 = already verified earlier (a repeated check of the same payment)
    if ((code === 100 || code === 101) && data.ref_id !== undefined) {
      return { ok: true, gatewayRef: String(data.ref_id), cardMask: data.card_pan || undefined };
    }
    if (code !== null && DEFINITE_FAIL.has(code)) return { ok: false, error: 'رد شده توسط درگاه (کد ' + code + ')' };
    throw new Error('zarinpal verify unexpected answer, code ' + code);
  },
};
