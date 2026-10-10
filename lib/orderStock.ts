import type { PoolClient } from 'pg';

// Puts the pieces of an order back in stock. Call it inside the transaction that sets the order to "canceled",
// after locking the order row, so it can only happen once. A size/color deleted from the product meanwhile is skipped.
export async function restockOrder(client: PoolClient, orderId: number): Promise<number> {
  const items = await client.query<{ product_slug: string; size: string; color: string; qty: number }>(
    'SELECT product_slug, size, color, qty FROM order_items WHERE order_id = $1 ORDER BY product_slug, size, color',
    [orderId],
  );
  let restocked = 0;
  for (const it of items.rows) {
    const res = await client.query(
      `UPDATE variants v SET stock = v.stock + $4
         FROM products p
        WHERE v.product_id = p.id AND p.slug = $1 AND v.size = $2 AND v.color = $3`,
      [it.product_slug, it.size, it.color, it.qty],
    );
    if (res.rowCount) restocked += it.qty;
  }
  return restocked;
}
