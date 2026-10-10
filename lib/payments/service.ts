import { db } from '@/lib/db';
import { getActiveProvider, getProvider } from './index';
import type { CallbackData } from './types';

// Payment logic that does not depend on any particular gateway.
// Rules: the amount always comes from OUR order, a gateway answer is always re-checked with the gateway (verify),
// one order can be paid only once (database guarantees it), and a repeated callback is harmless.

export type StartResult =
  | { ok: true; redirectUrl: string; provider: string }
  | { ok: false; reason: 'disabled' | 'not_found' | 'not_payable' | 'already_paid' | 'gateway_error' };

export async function startPayment(orderCode: string, mobile: string, origin: string): Promise<StartResult> {
  const provider = getActiveProvider();
  if (!provider) return { ok: false, reason: 'disabled' };

  const res = await db().query<{ id: number; status: string; payment_status: string; total: number; mobile: string }>(
    'SELECT id, status, payment_status, total, mobile FROM orders WHERE code = $1',
    [orderCode],
  );
  const order = res.rows[0];
  // Same answer for "no such code" and "wrong mobile", so codes cannot be probed.
  if (!order || order.mobile !== mobile) return { ok: false, reason: 'not_found' };
  if (order.payment_status === 'paid') return { ok: false, reason: 'already_paid' };
  if (order.status === 'canceled' || order.total <= 0) return { ok: false, reason: 'not_payable' };

  let started;
  try {
    started = await provider.start({
      orderCode,
      amount: order.total,
      mobile: order.mobile,
      description: 'سفارش ' + orderCode,
      callbackUrl: `${origin}/api/pay/callback/${provider.id}`,
    });
  } catch (e) {
    console.error('PAYMENT_START_FAILED', provider.id, orderCode, e);
    return { ok: false, reason: 'gateway_error' };
  }

  await db().query('INSERT INTO payments (order_id, provider, amount, reference) VALUES ($1, $2, $3, $4)', [
    order.id,
    provider.id,
    order.total,
    started.reference,
  ]);
  return { ok: true, redirectUrl: started.redirectUrl, provider: provider.id };
}

export type CompleteResult =
  | { kind: 'paid'; code: string }
  | { kind: 'paid_but_canceled'; code: string } // money was taken but the order had been canceled: needs a refund
  | { kind: 'duplicate'; code: string } // the order was already paid by another attempt: needs a refund
  | { kind: 'failed'; code: string | null; cancelled: boolean }
  | { kind: 'invalid' };

type PayRow = { id: number; order_id: number; status: string; amount: number; code: string };

export async function completePayment(providerId: string, callback: CallbackData): Promise<CompleteResult> {
  const provider = getProvider(providerId);
  if (!provider) return { kind: 'invalid' };
  const parsed = provider.parseCallback(callback);
  if (!parsed.reference) return { kind: 'invalid' };

  const found = await db().query<PayRow>(
    `SELECT p.id, p.order_id, p.status, p.amount, o.code
       FROM payments p JOIN orders o ON o.id = p.order_id
      WHERE p.provider = $1 AND p.reference = $2`,
    [provider.id, parsed.reference],
  );
  const pay = found.rows[0];
  if (!pay) return { kind: 'invalid' };

  // Repeated or late callbacks never change anything.
  if (pay.status === 'paid') return { kind: 'paid', code: pay.code };
  if (pay.status === 'failed') return { kind: 'failed', code: pay.code, cancelled: parsed.cancelled };

  if (parsed.cancelled) {
    await db().query(`UPDATE payments SET status = 'failed', error = $2 WHERE id = $1 AND status = 'started'`, [pay.id, 'cancelled by customer']);
    return { kind: 'failed', code: pay.code, cancelled: true };
  }

  // Ask the gateway (network call, kept outside the transaction).
  let verdict;
  try {
    verdict = await provider.verify({ reference: parsed.reference, amount: pay.amount, callback });
  } catch (e) {
    // Gateway unreachable: leave the payment 'started' so a repeated callback or a later check can finish it.
    console.error('PAYMENT_VERIFY_ERROR', provider.id, pay.code, e);
    return { kind: 'failed', code: pay.code, cancelled: false };
  }
  if (!verdict.ok) {
    await db().query(`UPDATE payments SET status = 'failed', error = $2 WHERE id = $1 AND status = 'started'`, [pay.id, verdict.error.slice(0, 200)]);
    return { kind: 'failed', code: pay.code, cancelled: false };
  }

  const client = await db().connect();
  try {
    await client.query('BEGIN');
    // Lock order first, then payment: same order everywhere, so no deadlocks.
    const ord = await client.query<{ status: string; payment_status: string }>('SELECT status, payment_status FROM orders WHERE id = $1 FOR UPDATE', [pay.order_id]);
    const cur = await client.query<{ status: string }>('SELECT status FROM payments WHERE id = $1 FOR UPDATE', [pay.id]);
    if (cur.rows[0]?.status === 'paid') {
      await client.query('ROLLBACK');
      return { kind: 'paid', code: pay.code };
    }
    if (ord.rows[0].payment_status === 'paid') {
      // Another attempt of the same order was paid first; this money must be refunded by hand.
      await client.query(`UPDATE payments SET status = 'failed', error = $2, gateway_ref = $3, card_mask = $4 WHERE id = $1`, [
        pay.id, 'DUPLICATE PAYMENT: refund needed', verdict.gatewayRef, verdict.cardMask ?? null,
      ]);
      await client.query('COMMIT');
      console.error('PAYMENT_DUPLICATE', provider.id, pay.code, verdict.gatewayRef);
      return { kind: 'duplicate', code: pay.code };
    }
    await client.query(`UPDATE payments SET status = 'paid', gateway_ref = $2, card_mask = $3, paid_at = now(), error = NULL WHERE id = $1`, [
      pay.id, verdict.gatewayRef, verdict.cardMask ?? null,
    ]);
    await client.query(`UPDATE orders SET payment_status = 'paid', paid_at = now() WHERE id = $1`, [pay.order_id]);
    await client.query('COMMIT');
    if (ord.rows[0].status === 'canceled') {
      console.error('PAYMENT_ON_CANCELED_ORDER', provider.id, pay.code, verdict.gatewayRef);
      return { kind: 'paid_but_canceled', code: pay.code };
    }
    return { kind: 'paid', code: pay.code };
  } catch (e) {
    await client.query('ROLLBACK').catch(() => {});
    throw e;
  } finally {
    client.release();
  }
}
