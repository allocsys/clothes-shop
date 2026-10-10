import { db, hasDb } from '@/lib/db';
import { restockOrder } from '@/lib/orderStock';

// Unpaid online orders hold their stock for a limited time, then are canceled and the pieces go back on the shelf.
// Only orders made while online payment was ON (pay_online) expire; offline orders never do.
// An order with a payment attempt started in the last 15 minutes is left alone, so a customer who is
// paying right now is not cut off. (If money still arrives for an expired order, the admin sees "needs refund".)
const GRACE_MINUTES = 15;

export function holdMinutes(): number {
  const n = Number(process.env.PAYMENT_HOLD_MINUTES);
  return Number.isFinite(n) && n >= 1 && n <= 1440 ? Math.floor(n) : 60;
}

const EXPIRED = `o.pay_online AND o.payment_status = 'unpaid' AND o.status = 'new'
  AND o.created_at < now() - make_interval(mins => $1)
  AND NOT EXISTS (SELECT 1 FROM payments p WHERE p.order_id = o.id AND p.status = 'started'
                    AND p.created_at > now() - make_interval(mins => $2))`;

async function expireOne(id: number, hold: number): Promise<boolean> {
  const client = await db().connect();
  try {
    await client.query('BEGIN');
    // Lock, then check again: a payment may have been made since the list was read.
    const still = await client.query(`SELECT o.id FROM orders o WHERE o.id = $3 AND ${EXPIRED} FOR UPDATE OF o`, [hold, GRACE_MINUTES, id]);
    if (!still.rowCount) {
      await client.query('ROLLBACK');
      return false;
    }
    await restockOrder(client, id);
    await client.query(`UPDATE orders SET status = 'canceled' WHERE id = $1`, [id]);
    await client.query('COMMIT');
    return true;
  } catch (e) {
    await client.query('ROLLBACK').catch(() => {});
    throw e;
  } finally {
    client.release();
  }
}

// Returns how many orders were canceled.
export async function releaseExpiredOrders(): Promise<number> {
  const hold = holdMinutes();
  const list = await db().query<{ id: number }>(`SELECT o.id FROM orders o WHERE ${EXPIRED} ORDER BY o.id LIMIT 50`, [hold, GRACE_MINUTES]);
  let n = 0;
  for (const r of list.rows) if (await expireOne(r.id, hold)) n++;
  if (n) console.log(`ORDERS_EXPIRED ${n}`);
  return n;
}

// Cheap, safe to call often: runs at most every 30 seconds per server process and never throws.
let last = 0;
export async function releaseExpiredOrdersSoon(): Promise<void> {
  if (!hasDb() || Date.now() - last < 30_000) return;
  last = Date.now();
  try {
    await releaseExpiredOrders();
  } catch (e) {
    console.error('ORDERS_EXPIRY_FAILED', e);
  }
}
