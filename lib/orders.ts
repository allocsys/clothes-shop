import { randomInt } from 'node:crypto';
import { db } from './db';
import type { OrderItem } from './checkout';
import { releaseExpiredOrdersSoon } from './orderExpiry';

// Saves an order and takes its items out of stock in ONE transaction:
// either everything is saved and stock is reduced, or nothing changes.

export type Customer = {
  name: string;
  phone: string;
  city: string;
  address: string;
  postalCode: string;
  notes: string;
};

export type OrderTotals = { subtotal: number; shipping: number; total: number };

export type CreateOrderResult =
  | { ok: true; code: string }
  | { ok: false; reason: 'out_of_stock'; title: string; size: string; color: string; available: number };

// No 0/O/1/I so a code read aloud over the phone is hard to mix up.
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function makeCode(): string {
  let s = '';
  for (let i = 0; i < 8; i++) s += ALPHABET[randomInt(ALPHABET.length)];
  return 'MP-' + s;
}

// Same product/size/color twice in one order becomes one line.
function mergeLines(items: OrderItem[]): OrderItem[] {
  const map = new Map<string, OrderItem>();
  for (const it of items) {
    const key = [it.slug, it.size, it.color].join('\u0000');
    const prev = map.get(key);
    if (prev) prev.qty += it.qty;
    else map.set(key, { ...it });
  }
  // Fixed order, so two orders at the same time lock rows in the same order (no deadlocks).
  return Array.from(map.values()).sort((a, b) =>
    (a.slug + a.size + a.color).localeCompare(b.slug + b.size + b.color),
  );
}

export async function createOrder(
  customer: Customer,
  rawItems: OrderItem[],
  products: { slug: string; title: string; price: number }[],
  totals: OrderTotals,
  opts: { payOnline?: boolean } = {},
): Promise<CreateOrderResult> {
  // Free the stock of unpaid online orders that ran out of time, so the last piece can be bought now.
  await releaseExpiredOrdersSoon();
  const items = mergeLines(rawItems);
  const client = await db().connect();
  try {
    await client.query('BEGIN');

    // 1) Take stock. The "stock >= qty" condition makes this safe when two people buy the last piece.
    for (const it of items) {
      const res = await client.query(
        `UPDATE variants v SET stock = v.stock - $4
           FROM products p
          WHERE v.product_id = p.id AND p.slug = $1 AND p.is_active
            AND v.size = $2 AND v.color = $3 AND v.stock >= $4
        RETURNING v.id`,
        [it.slug, it.size, it.color, it.qty],
      );
      if (res.rowCount === 0) {
        const left = await client.query(
          `SELECT v.stock FROM variants v JOIN products p ON p.id = v.product_id
            WHERE p.slug = $1 AND v.size = $2 AND v.color = $3`,
          [it.slug, it.size, it.color],
        );
        await client.query('ROLLBACK');
        const title = products.find((p) => p.slug === it.slug)?.title ?? it.slug;
        return {
          ok: false,
          reason: 'out_of_stock',
          title,
          size: it.size,
          color: it.color,
          available: left.rows[0]?.stock ?? 0,
        };
      }
    }

    // 2) Save the order (retry if the random code is already taken).
    let orderId = 0;
    let code = '';
    for (let attempt = 0; attempt < 5 && !orderId; attempt++) {
      code = makeCode();
      const res = await client.query(
        `INSERT INTO orders (code, customer_name, mobile, city, postal_code, address, note, subtotal, shipping, total, pay_online)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
         ON CONFLICT (code) DO NOTHING
         RETURNING id`,
        [
          code,
          customer.name,
          customer.phone,
          customer.city,
          customer.postalCode,
          customer.address,
          customer.notes,
          totals.subtotal,
          totals.shipping,
          totals.total,
          Boolean(opts.payOnline),
        ],
      );
      if (res.rowCount) orderId = res.rows[0].id;
    }
    if (!orderId) throw new Error('Could not create a unique order code');

    // 3) Save what was bought (title and price at this moment).
    for (const it of items) {
      const p = products.find((x) => x.slug === it.slug)!;
      await client.query(
        `INSERT INTO order_items (order_id, product_slug, title, size, color, qty, unit_price)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [orderId, it.slug, p.title, it.size, it.color, it.qty, p.price],
      );
    }

    await client.query('COMMIT');
    return { ok: true, code };
  } catch (e) {
    await client.query('ROLLBACK').catch(() => {});
    throw e;
  } finally {
    client.release();
  }
}

// What the public order page may show: no name, address or phone.
export type OrderSummary = { code: string; total: number; status: string; paymentStatus: 'unpaid' | 'paid' };

export async function getOrderSummary(code: string): Promise<OrderSummary | null> {
  const res = await db().query('SELECT code, total, status, payment_status FROM orders WHERE code = $1', [code]);
  const r = res.rows[0];
  return r ? { code: r.code, total: r.total, status: r.status, paymentStatus: r.payment_status } : null;
}
