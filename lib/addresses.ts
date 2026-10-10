import { db } from '@/lib/db';
import { toEnglishDigits } from '@/lib/checkout';
import { ADDRESS_LIMIT, type SavedAddress } from '@/lib/addressTypes';

// Saved delivery addresses. Every function takes the customer id of the logged-in customer and only ever
// touches that customer's own rows. Changes run in one transaction under a per-customer lock, so two
// quick taps can never leave two default addresses or go over the limit.
export { ADDRESS_LIMIT };
export type { SavedAddress };

export type AddressInput = { title: string; city: string; postalCode: string; address: string };

const clean = (v: unknown, max: number) =>
  typeof v === 'string' ? v.replace(/[\u0000-\u001f\u007f<>]/g, ' ').replace(/[ \t]+/g, ' ').trim().slice(0, max) : '';

// Returns the cleaned input, or an error message in Persian.
export function validateAddress(body: any): { ok: true; value: AddressInput } | { ok: false; error: string } {
  const title = clean(body?.title, 30);
  const city = clean(body?.city, 60);
  const address = clean(body?.address, 400);
  const postalCode = toEnglishDigits(clean(body?.postalCode, 20)).replace(/[\s-]/g, '');
  if (city.length < 2) return { ok: false, error: 'شهر را وارد کنید.' };
  if (address.length < 8) return { ok: false, error: 'آدرس را کامل‌تر بنویسید.' };
  if (postalCode && !/^\d{10}$/.test(postalCode)) return { ok: false, error: 'کد پستی باید ۱۰ رقم باشد.' };
  return { ok: true, value: { title, city, postalCode, address } };
}

const toAddress = (r: any): SavedAddress => ({
  id: r.id,
  title: r.title,
  city: r.city,
  postalCode: r.postal_code,
  address: r.address,
  isDefault: r.is_default,
});

const SELECT = `SELECT id, title, city, postal_code, address, is_default FROM customer_addresses WHERE customer_id = $1 ORDER BY is_default DESC, id`;

export async function listAddresses(customerId: number): Promise<SavedAddress[]> {
  const r = await db().query(SELECT, [customerId]);
  return r.rows.map(toAddress);
}

export type AddressResult = { ok: true; addresses: SavedAddress[] } | { ok: false; error: string; status: number };

async function inTransaction(customerId: number, work: (q: (sql: string, params?: any[]) => Promise<any>) => Promise<AddressResult | null>): Promise<AddressResult> {
  const client = await db().connect();
  try {
    await client.query('BEGIN');
    await client.query('SELECT pg_advisory_xact_lock(hashtext($1))', ['addr:' + customerId]);
    const failed = await work((sql, params) => client.query(sql, params));
    if (failed) {
      await client.query('ROLLBACK');
      return failed;
    }
    const list = await client.query(SELECT, [customerId]);
    await client.query('COMMIT');
    return { ok: true, addresses: list.rows.map(toAddress) };
  } catch (e) {
    await client.query('ROLLBACK').catch(() => {});
    throw e;
  } finally {
    client.release();
  }
}

const notFound: AddressResult = { ok: false, error: 'این آدرس پیدا نشد.', status: 404 };

// The first address is always the default. Otherwise the default only changes when asked to.
export function addAddress(customerId: number, input: AddressInput, makeDefault: boolean): Promise<AddressResult> {
  return inTransaction(customerId, async (q) => {
    const count = Number((await q(`SELECT count(*) AS n FROM customer_addresses WHERE customer_id = $1`, [customerId])).rows[0].n);
    if (count >= ADDRESS_LIMIT) return { ok: false, error: 'حداکثر ' + ADDRESS_LIMIT.toLocaleString('fa-IR') + ' آدرس می‌توانید ذخیره کنید. یکی را حذف کنید.', status: 409 };
    const asDefault = makeDefault || count === 0;
    if (asDefault) await q(`UPDATE customer_addresses SET is_default = false WHERE customer_id = $1 AND is_default`, [customerId]);
    await q(
      `INSERT INTO customer_addresses (customer_id, title, city, postal_code, address, is_default) VALUES ($1, $2, $3, $4, $5, $6)`,
      [customerId, input.title, input.city, input.postalCode, input.address, asDefault],
    );
    return null;
  });
}

export function updateAddress(customerId: number, id: number, input: AddressInput, makeDefault: boolean): Promise<AddressResult> {
  return inTransaction(customerId, async (q) => {
    const own = await q(`SELECT is_default FROM customer_addresses WHERE id = $1 AND customer_id = $2`, [id, customerId]);
    if (own.rows.length === 0) return notFound;
    if (makeDefault) await q(`UPDATE customer_addresses SET is_default = false WHERE customer_id = $1 AND is_default AND id <> $2`, [customerId, id]);
    // An address that is already the default stays the default (there must always be one).
    const isDefault = makeDefault || own.rows[0].is_default;
    await q(
      `UPDATE customer_addresses SET title = $3, city = $4, postal_code = $5, address = $6, is_default = $7 WHERE id = $1 AND customer_id = $2`,
      [id, customerId, input.title, input.city, input.postalCode, input.address, isDefault],
    );
    return null;
  });
}

export function setDefaultAddress(customerId: number, id: number): Promise<AddressResult> {
  return inTransaction(customerId, async (q) => {
    const own = await q(`SELECT 1 FROM customer_addresses WHERE id = $1 AND customer_id = $2`, [id, customerId]);
    if (own.rows.length === 0) return notFound;
    await q(`UPDATE customer_addresses SET is_default = false WHERE customer_id = $1 AND is_default AND id <> $2`, [customerId, id]);
    await q(`UPDATE customer_addresses SET is_default = true WHERE id = $1 AND customer_id = $2`, [id, customerId]);
    return null;
  });
}

// Deleting the default hands the "default" mark to the oldest address left.
export function deleteAddress(customerId: number, id: number): Promise<AddressResult> {
  return inTransaction(customerId, async (q) => {
    const gone = await q(`DELETE FROM customer_addresses WHERE id = $1 AND customer_id = $2 RETURNING is_default`, [id, customerId]);
    if (gone.rows.length === 0) return notFound;
    if (gone.rows[0].is_default) {
      await q(
        `UPDATE customer_addresses SET is_default = true
          WHERE id = (SELECT id FROM customer_addresses WHERE customer_id = $1 ORDER BY id LIMIT 1)`,
        [customerId],
      );
    }
    return null;
  });
}
