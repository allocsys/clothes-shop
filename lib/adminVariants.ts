import { db } from '@/lib/db';

// Sizes, colors and stock per size/color for one product (admin only).
// Saving is safe next to live orders: a row is only written when the admin changed it, and only if the
// stock in the database is still what the admin saw. Otherwise nothing is saved and the admin must reload.

export type AdminVariant = { size: string; color: string; stock: number };

export async function listVariants(productId: number): Promise<AdminVariant[]> {
  const { rows } = await db().query<AdminVariant>(
    'SELECT size, color, stock FROM variants WHERE product_id = $1 ORDER BY id',
    [productId],
  );
  return rows;
}

export type VariantInput = { size: string; color: string; stock: number; loaded: number | null }; // loaded = stock the admin saw (null = new row)

const MAX_VARIANTS = 200;
const MAX_STOCK = 99_999;
const clean = (s: unknown) => (typeof s === 'string' ? s.replace(/\s+/g, ' ').trim() : '');

export function validateVariants(raw: unknown): { ok: true; value: VariantInput[] } | { ok: false; error: string } {
  const list = (raw && typeof raw === 'object' ? (raw as Record<string, unknown>).variants : null) as unknown;
  if (!Array.isArray(list)) return { ok: false, error: 'فهرست موجودی معتبر نیست.' };
  if (list.length === 0) return { ok: false, error: 'حداقل یک سایز و رنگ لازم است.' };
  if (list.length > MAX_VARIANTS) return { ok: false, error: 'تعداد ردیف‌ها زیاد است.' };

  const isInt = (v: unknown): v is number => typeof v === 'number' && Number.isInteger(v);
  const seen = new Set<string>();
  const out: VariantInput[] = [];
  for (const item of list) {
    const r = (item && typeof item === 'object' ? item : {}) as Record<string, unknown>;
    const size = clean(r.size);
    const color = clean(r.color);
    if (!size || size.length > 20) return { ok: false, error: 'سایز هر ردیف را وارد کنید (حداکثر ۲۰ حرف).' };
    if (!color || color.length > 30) return { ok: false, error: 'رنگ هر ردیف را وارد کنید (حداکثر ۳۰ حرف).' };
    if (!isInt(r.stock) || r.stock < 0 || r.stock > MAX_STOCK) return { ok: false, error: 'موجودی باید عدد صحیح بین ۰ تا ۹۹٬۹۹۹ باشد.' };
    if (r.loaded !== null && r.loaded !== undefined && (!isInt(r.loaded) || r.loaded < 0)) return { ok: false, error: 'درخواست معتبر نیست.' };
    const key = size.toLowerCase() + '|' + color;
    if (seen.has(key)) return { ok: false, error: `سایز «${size}» با رنگ «${color}» دو بار آمده است.` };
    seen.add(key);
    out.push({ size, color, stock: r.stock, loaded: r.loaded == null ? null : (r.loaded as number) });
  }
  return { ok: true, value: out };
}

export type SaveResult =
  | { ok: true; variants: AdminVariant[] }
  | { ok: false; reason: 'not_found' }
  | { ok: false; reason: 'conflict'; label: string };

export async function saveVariants(productId: number, input: VariantInput[]): Promise<SaveResult> {
  const client = await db().connect();
  try {
    await client.query('BEGIN');
    const prod = await client.query('SELECT id FROM products WHERE id = $1 FOR UPDATE', [productId]);
    if (prod.rowCount === 0) {
      await client.query('ROLLBACK');
      return { ok: false, reason: 'not_found' };
    }
    const cur = await client.query<{ id: number; size: string; color: string; stock: number }>(
      'SELECT id, size, color, stock FROM variants WHERE product_id = $1 FOR UPDATE',
      [productId],
    );
    const byKey = new Map(cur.rows.map((v) => [v.size + '|' + v.color, v]));
    const keep = new Set<string>();

    for (const v of input) {
      const key = v.size + '|' + v.color;
      keep.add(key);
      const existing = byKey.get(key);
      if (!existing) {
        await client.query('INSERT INTO variants (product_id, size, color, stock) VALUES ($1, $2, $3, $4)', [productId, v.size, v.color, v.stock]);
      } else if (v.loaded !== null && v.stock === v.loaded) {
        // admin did not touch the stock of this row: leave it alone (orders may have changed it)
      } else if (v.loaded !== null && existing.stock !== v.loaded) {
        await client.query('ROLLBACK');
        return { ok: false, reason: 'conflict', label: `${v.size} / ${v.color}` };
      } else {
        await client.query('UPDATE variants SET stock = $2 WHERE id = $1', [existing.id, v.stock]);
      }
    }
    for (const v of cur.rows) {
      if (!keep.has(v.size + '|' + v.color)) await client.query('DELETE FROM variants WHERE id = $1', [v.id]);
    }
    await client.query('UPDATE products SET updated_at = now() WHERE id = $1', [productId]);
    const fresh = await client.query<AdminVariant>('SELECT size, color, stock FROM variants WHERE product_id = $1 ORDER BY id', [productId]);
    await client.query('COMMIT');
    return { ok: true, variants: fresh.rows };
  } catch (e) {
    await client.query('ROLLBACK').catch(() => {});
    throw e;
  } finally {
    client.release();
  }
}
