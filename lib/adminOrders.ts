import { db } from '@/lib/db';

// Orders for the admin panel: list, one order, and changing its status.
// Canceling an order puts its pieces back in stock, once, inside the same transaction.

export { STATUSES, STATUS_LABEL, isStatus, allowedNext } from '@/lib/orderStatus';
export type { OrderStatus } from '@/lib/orderStatus';
import { STATUSES, allowedNext, isStatus, type OrderStatus } from '@/lib/orderStatus';

export type OrderRow = {
  id: number;
  code: string;
  status: OrderStatus;
  customerName: string;
  mobile: string;
  city: string;
  total: number;
  createdAt: string; // ISO
  itemCount: number;
};

export const PAGE_SIZE = 30;

type ListRow = {
  id: number; code: string; status: OrderStatus; customer_name: string; mobile: string; city: string;
  total: number; created_at: Date; item_count: number;
};

export async function listOrders(opts: { status?: string; q?: string; page?: number }): Promise<{ rows: OrderRow[]; hasMore: boolean }> {
  const where: string[] = [];
  const args: unknown[] = [];
  if (isStatus(opts.status)) {
    args.push(opts.status);
    where.push(`o.status = $${args.length}`);
  }
  const q = (opts.q ?? '').trim().slice(0, 60);
  if (q) {
    args.push('%' + q.replace(/[\\%_]/g, (c) => '\\' + c) + '%');
    where.push(`(o.code ILIKE $${args.length} OR o.mobile LIKE $${args.length} OR o.customer_name ILIKE $${args.length})`);
  }
  const page = Math.max(1, Math.floor(opts.page ?? 1));
  args.push(PAGE_SIZE + 1, (page - 1) * PAGE_SIZE);
  const { rows } = await db().query<ListRow>(
    `SELECT o.id, o.code, o.status, o.customer_name, o.mobile, o.city, o.total, o.created_at,
            COALESCE((SELECT SUM(qty) FROM order_items i WHERE i.order_id = o.id), 0)::int AS item_count
       FROM orders o
      ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
      ORDER BY o.created_at DESC, o.id DESC
      LIMIT $${args.length - 1} OFFSET $${args.length}`,
    args,
  );
  return {
    hasMore: rows.length > PAGE_SIZE,
    rows: rows.slice(0, PAGE_SIZE).map((r) => ({
      id: r.id, code: r.code, status: r.status, customerName: r.customer_name, mobile: r.mobile, city: r.city,
      total: r.total, createdAt: r.created_at.toISOString(), itemCount: r.item_count,
    })),
  };
}

export async function statusCounts(): Promise<Record<OrderStatus, number>> {
  const { rows } = await db().query<{ status: OrderStatus; n: number }>('SELECT status, count(*)::int AS n FROM orders GROUP BY status');
  const out = Object.fromEntries(STATUSES.map((s) => [s, 0])) as Record<OrderStatus, number>;
  for (const r of rows) out[r.status] = r.n;
  return out;
}

export type OrderItemRow = { slug: string; title: string; size: string; color: string; qty: number; unitPrice: number };
export type OrderDetail = {
  id: number; code: string; status: OrderStatus; customerName: string; mobile: string; city: string;
  postalCode: string; address: string; note: string; subtotal: number; shipping: number; total: number;
  createdAt: string; items: OrderItemRow[];
};

export async function getOrder(id: number): Promise<OrderDetail | null> {
  const o = await db().query(
    `SELECT id, code, status, customer_name, mobile, city, postal_code, address, note, subtotal, shipping, total, created_at
       FROM orders WHERE id = $1`,
    [id],
  );
  const r = o.rows[0];
  if (!r) return null;
  const items = await db().query(
    'SELECT product_slug, title, size, color, qty, unit_price FROM order_items WHERE order_id = $1 ORDER BY id',
    [id],
  );
  return {
    id: r.id, code: r.code, status: r.status, customerName: r.customer_name, mobile: r.mobile, city: r.city,
    postalCode: r.postal_code, address: r.address, note: r.note, subtotal: r.subtotal, shipping: r.shipping,
    total: r.total, createdAt: (r.created_at as Date).toISOString(),
    items: items.rows.map((i) => ({ slug: i.product_slug, title: i.title, size: i.size, color: i.color, qty: i.qty, unitPrice: i.unit_price })),
  };
}

export type ChangeResult =
  | { ok: true; status: OrderStatus; restocked: number }
  | { ok: false; reason: 'not_found' }
  | { ok: false; reason: 'stale'; current: OrderStatus }
  | { ok: false; reason: 'not_allowed'; current: OrderStatus };

// `from` is the status the admin was looking at: if someone else changed the order meanwhile, nothing happens.
export async function changeStatus(id: number, to: OrderStatus, from: OrderStatus): Promise<ChangeResult> {
  const client = await db().connect();
  try {
    await client.query('BEGIN');
    const cur = await client.query<{ status: OrderStatus }>('SELECT status FROM orders WHERE id = $1 FOR UPDATE', [id]);
    if (!cur.rows[0]) {
      await client.query('ROLLBACK');
      return { ok: false, reason: 'not_found' };
    }
    const current = cur.rows[0].status;
    if (current !== from) {
      await client.query('ROLLBACK');
      return { ok: false, reason: 'stale', current };
    }
    if (!allowedNext(current).includes(to)) {
      await client.query('ROLLBACK');
      return { ok: false, reason: 'not_allowed', current };
    }

    let restocked = 0;
    if (to === 'canceled') {
      // Put the pieces back. A size/color that was deleted from the product meanwhile cannot be restocked.
      const items = await client.query<{ product_slug: string; size: string; color: string; qty: number }>(
        'SELECT product_slug, size, color, qty FROM order_items WHERE order_id = $1 ORDER BY product_slug, size, color',
        [id],
      );
      for (const it of items.rows) {
        const res = await client.query(
          `UPDATE variants v SET stock = v.stock + $4
             FROM products p
            WHERE v.product_id = p.id AND p.slug = $1 AND v.size = $2 AND v.color = $3`,
          [it.product_slug, it.size, it.color, it.qty],
        );
        if (res.rowCount) restocked += it.qty;
      }
    }
    await client.query('UPDATE orders SET status = $2 WHERE id = $1', [id, to]);
    await client.query('COMMIT');
    return { ok: true, status: to, restocked };
  } catch (e) {
    await client.query('ROLLBACK').catch(() => {});
    throw e;
  } finally {
    client.release();
  }
}
