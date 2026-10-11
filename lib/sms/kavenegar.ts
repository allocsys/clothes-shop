import { postForm } from '@/lib/payments/http';
import type { SmsProvider } from './types';

// Kavenegar (کاوه‌نگار) REST API, plain send:
//   POST https://api.kavenegar.com/v1/<API-KEY>/sms/send.json   (form fields: receptor, message, optional sender)
// The answer is JSON: return.status 200 = accepted, entries[0].messageid = the message id.
// Other codes (checked against the Kavenegar docs): 401 account inactive, 403 wrong API key, 411 bad receiver,
// 412 bad sender line, 413 empty or too long text, 418 not enough credit. The HTTP status mirrors return.status,
// and only 5xx throws (see postForm), so a broken Kavenegar counts as a failed send, never as a lost order.
//
// Settings: KAVENEGAR_API_KEY (required), KAVENEGAR_SENDER (optional line number; empty = the account's default line).

const BASE = 'https://api.kavenegar.com/v1/';

function apiKey(): string {
  return (process.env.KAVENEGAR_API_KEY ?? '').trim();
}

function sender(): string {
  return (process.env.KAVENEGAR_SENDER ?? '').trim();
}

// A usable API key (no spaces or odd characters, it goes into the address) and, if given, a sane sender line (e.g. 10004346 or +9810004346).
export function kavenegarConfigured(): boolean {
  const senderOk = sender() === '' || /^\+?\d{4,15}$/.test(sender());
  return /^[A-Za-z0-9+/=_-]{16,}$/.test(apiKey()) && senderOk;
}

type Answer = {
  return?: { status?: number; message?: string };
  entries?: unknown;
} | null;

export const kavenegarSmsProvider: SmsProvider = {
  id: 'kavenegar',
  label: 'کاوه‌نگار',
  configured: kavenegarConfigured,
  async send({ to, text }) {
    if (!kavenegarConfigured()) return { ok: false, error: 'kavenegar is not configured' };
    const fields: Record<string, string> = { receptor: to, message: text };
    if (sender()) fields.sender = sender();
    // 7 s: shorter than the 8 s limit in lib/sms/service.ts, so the request is cancelled instead of left hanging.
    const answer = (await postForm(BASE + encodeURIComponent(apiKey()) + '/sms/send.json', fields, 7000)) as Answer;
    const status = answer?.return?.status;
    if (status !== 200) {
      // Never put the API key (or the URL) in an error: it ends up in sms_log and the server log.
      return { ok: false, error: 'kavenegar ' + (status ?? '?') + (answer?.return?.message ? ': ' + answer.return.message : '') };
    }
    const first = Array.isArray(answer?.entries) ? (answer?.entries as Array<{ messageid?: number | string }>)[0] : undefined;
    return { ok: true, reference: first?.messageid !== undefined ? String(first.messageid) : undefined };
  },
};
