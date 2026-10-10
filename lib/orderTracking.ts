import { db } from './db';

// What a customer may see after proving they know BOTH the order code and the mobile number:
// status, payment state, what they bought and the totals. Never the name, address or phone.
export type TrackedItem = { title: string; size: string; color: string; qty: number; unitPrice: number };

export type TrackedOrder = {
  code: string;
  status: string;
  paymentStatus: 'unpaid' | 'paid';
  payOnline: boolean;
  createdAt: string; // ISO
  items: TrackedItem[];
  subtotal: number;
  shipping: number;
  total: number;
};

// A wrong code and a wrong mobile give the same answer (null), so nobody can learn which one was right.
export async function trackOrder(code: string, mobile: string): Promise<TrackedOrder | null> {
  const res = await db().query(
    `SELECT id, code, status, payment_status, pay_online, created_at, subtotal, shipping, total
       FROM orders WHERE code = $1 AND mobile = $2`,
    [code, mobile],
  );
  const o = res.rows[0];
  if (!o) return null;
  const items = await db().query(
    `SELECT title, size, color, qty, unit_price FROM order_items WHERE order_id = $1 ORDER BY id`,
    [o.id],
  );
  return {
    code: o.code,
    status: o.status,
    paymentStatus: o.payment_status,
    payOnline: Boolean(o.pay_online),
    createdAt: new Date(o.created_at).toISOString(),
    items: items.rows.map((r) => ({ title: r.title, size: r.size, color: r.color, qty: r.qty, unitPrice: r.unit_price })),
    subtotal: o.subtotal,
    shipping: o.shipping,
    total: o.total,
  };
}
