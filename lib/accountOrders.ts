import { db } from '@/lib/db';

// Order history for a logged-in customer. The customer proved they own the mobile number (SMS code),
// so they may see their own orders: code, date, status, payment state, items and totals.
// Never other people's orders, and never the address or notes.
export type HistoryItem = { title: string; size: string; color: string; qty: number };
export type HistoryOrder = {
  code: string;
  status: string;
  paymentStatus: 'unpaid' | 'paid';
  createdAt: string; // ISO
  total: number;
  items: HistoryItem[];
};

export const HISTORY_LIMIT = 30;

export async function listCustomerOrders(mobile: string, limit: number = HISTORY_LIMIT): Promise<HistoryOrder[]> {
  const res = await db().query(
    `SELECT id, code, status, payment_status, created_at, total
       FROM orders WHERE mobile = $1 ORDER BY created_at DESC, id DESC LIMIT $2`,
    [mobile, limit],
  );
  if (res.rows.length === 0) return [];
  const ids = res.rows.map((r) => r.id);
  const items = await db().query(
    `SELECT order_id, title, size, color, qty FROM order_items WHERE order_id = ANY($1::int[]) ORDER BY id`,
    [ids],
  );
  const byOrder = new Map<number, HistoryItem[]>();
  for (const r of items.rows) {
    const list = byOrder.get(r.order_id) ?? [];
    list.push({ title: r.title, size: r.size, color: r.color, qty: r.qty });
    byOrder.set(r.order_id, list);
  }
  return res.rows.map((r) => ({
    code: r.code,
    status: r.status,
    paymentStatus: r.payment_status,
    createdAt: new Date(r.created_at).toISOString(),
    total: r.total,
    items: byOrder.get(r.id) ?? [],
  }));
}
