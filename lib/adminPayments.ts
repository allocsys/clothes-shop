import { db } from '@/lib/db';

// A payment needs a refund when the customer paid but the order will not be fulfilled:
//  - the money arrived for an order that is canceled (canceled before or after paying), or
//  - the same order was paid twice (the second payment is stored as failed with a DUPLICATE note).
// The admin returns the money by hand in the gateway panel, then marks it done here.
// Expects the aliases `p` (payments) and `o` (orders).
export const NEEDS_REFUND_SQL = `(p.refunded_at IS NULL AND ((p.status = 'paid' AND o.status = 'canceled') OR (p.status = 'failed' AND p.error LIKE 'DUPLICATE%')))`;

export async function refundCount(): Promise<number> {
  const r = await db().query(`SELECT count(*)::int AS n FROM payments p JOIN orders o ON o.id = p.order_id WHERE ${NEEDS_REFUND_SQL}`);
  return r.rows[0].n;
}

export type RefundResult = { ok: true } | { ok: false; reason: 'not_needed' };

export async function markRefunded(paymentId: number): Promise<RefundResult> {
  const r = await db().query(
    `UPDATE payments p SET refunded_at = now() FROM orders o WHERE o.id = p.order_id AND p.id = $1 AND ${NEEDS_REFUND_SQL} RETURNING p.id`,
    [paymentId],
  );
  return r.rowCount ? { ok: true } : { ok: false, reason: 'not_needed' };
}
