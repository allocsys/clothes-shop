import { db, hasDb } from '@/lib/db';
import { getActiveSmsProvider, smsMisconfigured } from './index';

export type SmsKind = 'order_placed' | 'login_code';

export type SmsOutcome =
  | { status: 'sent' }
  | { status: 'skipped'; reason: 'off' | 'duplicate' }
  | { status: 'failed'; error: string };

const TIMEOUT_MS = 8000;

function withTimeout<T>(p: Promise<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error('timeout')), TIMEOUT_MS);
    p.then(
      (v) => { clearTimeout(t); resolve(v); },
      (e) => { clearTimeout(t); reject(e); },
    );
  });
}

// Sends one SMS and records it in sms_log. NEVER throws: a broken SMS must never break an order.
// With an orderCode, the same kind is sent at most once per order.
// logText: what to keep in sms_log instead of the real text (a login code must never be stored in the log).
export async function sendSms(input: { kind: SmsKind; to: string; text: string; orderCode?: string; logText?: string }): Promise<SmsOutcome> {
  try {
    const provider = getActiveSmsProvider();
    if (!provider) {
      if (smsMisconfigured()) console.error('SMS_PROVIDER is set but unknown or not allowed here: SMS is OFF');
      return { status: 'skipped', reason: 'off' };
    }

    // Without a database there is no log and no duplicate protection; just send.
    let logId: number | null = null;
    if (hasDb()) {
      const ins = await db().query(
        `INSERT INTO sms_log (kind, order_code, mobile, body, provider)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (kind, order_code) WHERE order_code IS NOT NULL DO NOTHING
         RETURNING id`,
        [input.kind, input.orderCode ?? null, input.to, input.logText ?? input.text, provider.id],
      );
      if (ins.rowCount === 0) return { status: 'skipped', reason: 'duplicate' };
      logId = ins.rows[0].id;
    }

    let result;
    try {
      result = await withTimeout(provider.send({ to: input.to, text: input.text }));
    } catch (e) {
      result = { ok: false as const, error: e instanceof Error ? e.message : 'send failed' };
    }

    if (logId !== null) {
      if (result.ok) {
        await db().query(`UPDATE sms_log SET status = 'sent', reference = $2, sent_at = now() WHERE id = $1`, [logId, result.reference ?? null]);
      } else {
        await db().query(`UPDATE sms_log SET status = 'failed', error = $2 WHERE id = $1`, [logId, result.error.slice(0, 300)]);
      }
    }
    if (result.ok) return { status: 'sent' };
    console.error('SMS_FAILED kind=' + input.kind + ' error=' + result.error);
    return { status: 'failed', error: result.error };
  } catch (e) {
    console.error('SMS_ERROR', e);
    return { status: 'failed', error: 'internal error' };
  }
}
