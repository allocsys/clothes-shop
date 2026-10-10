import { randomBytes } from 'crypto';
import sharp from 'sharp';
import { db } from '@/lib/db';
import { getStorage, isValidKey } from '@/lib/storage';

// Product photos in the admin: validate, convert, store, and keep products.images in order
// (first key = main photo). Files go through lib/storage.ts, so a later move to ArvanCloud changes nothing here.

export const MAX_PHOTOS = 10;
export const MAX_UPLOAD_BYTES = 8 * 1024 * 1024; // the browser shrinks photos first; this is the server's hard limit
const MAX_SIDE = 1600; // px, longest side after conversion
const ALLOWED = new Set(['jpeg', 'png', 'webp', 'gif']);

export async function getPhotoKeys(productId: number): Promise<string[] | null> {
  const { rows } = await db().query<{ images: string[] }>('SELECT images FROM products WHERE id = $1', [productId]);
  return rows[0] ? rows[0].images : null;
}

export type Converted = { ok: true; data: Buffer } | { ok: false; error: string };

// Checks that the bytes really are a picture (not just a file named .jpg), fixes the phone's rotation,
// shrinks it, converts to WebP and drops metadata such as GPS location.
export async function convertPhoto(input: Buffer): Promise<Converted> {
  if (input.length === 0) return { ok: false, error: 'فایل خالی است.' };
  if (input.length > MAX_UPLOAD_BYTES) return { ok: false, error: 'حجم عکس بیشتر از ۸ مگابایت است.' };
  try {
    const img = sharp(input, { limitInputPixels: 60_000_000, failOn: 'error' });
    const meta = await img.metadata();
    if (!meta.format || !ALLOWED.has(meta.format)) return { ok: false, error: 'فقط عکس JPG، PNG یا WebP قابل قبول است.' };
    const data = await img
      .rotate()
      .resize({ width: MAX_SIDE, height: MAX_SIDE, fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 82 })
      .toBuffer();
    return { ok: true, data };
  } catch {
    return { ok: false, error: 'این فایل عکس معتبری نیست.' };
  }
}

export const newPhotoKey = (productId: number) => `products/${productId}-${randomBytes(6).toString('hex')}.webp`;

export type AddResult = { ok: true; images: string[] } | { ok: false; reason: 'not_found' | 'limit' };

// Stores a converted photo and appends its key. The limit is checked inside the same UPDATE, so two
// uploads at once can never go over it.
export async function addPhoto(productId: number, data: Buffer): Promise<AddResult> {
  const exists = await db().query('SELECT 1 FROM products WHERE id = $1', [productId]);
  if (exists.rowCount === 0) return { ok: false, reason: 'not_found' };

  const key = newPhotoKey(productId);
  const storage = getStorage();
  await storage.put(key, data);
  const { rows } = await db().query<{ images: string[] }>(
    `UPDATE products SET images = array_append(images, $2), updated_at = now()
      WHERE id = $1 AND cardinality(images) < $3 RETURNING images`,
    [productId, key, MAX_PHOTOS],
  );
  if (!rows[0]) {
    await storage.remove(key); // no room (or the product vanished): do not leave an orphan file
    return { ok: false, reason: 'limit' };
  }
  return { ok: true, images: rows[0].images };
}

export type ReorderResult = { ok: true; images: string[] } | { ok: false; reason: 'not_found' | 'mismatch' };

// New order for the same set of photos (the first one becomes the main photo).
// Refuses when the list is not exactly the product's current photos (someone uploaded or deleted meanwhile).
export async function reorderPhotos(productId: number, order: string[]): Promise<ReorderResult> {
  const client = await db().connect();
  try {
    await client.query('BEGIN');
    const cur = await client.query<{ images: string[] }>('SELECT images FROM products WHERE id = $1 FOR UPDATE', [productId]);
    if (!cur.rows[0]) {
      await client.query('ROLLBACK');
      return { ok: false, reason: 'not_found' };
    }
    const have = cur.rows[0].images;
    const same = have.length === order.length && new Set(order).size === order.length && order.every((k) => have.includes(k));
    if (!same) {
      await client.query('ROLLBACK');
      return { ok: false, reason: 'mismatch' };
    }
    await client.query('UPDATE products SET images = $2, updated_at = now() WHERE id = $1', [productId, order]);
    await client.query('COMMIT');
    return { ok: true, images: order };
  } catch (e) {
    await client.query('ROLLBACK').catch(() => {});
    throw e;
  } finally {
    client.release();
  }
}

export type RemoveResult = { ok: true; images: string[] } | { ok: false; reason: 'not_found' };

// Removes one photo from the product, then deletes its file (only files we created under products/).
export async function removePhoto(productId: number, key: string): Promise<RemoveResult> {
  const { rows } = await db().query<{ images: string[] }>(
    `UPDATE products SET images = array_remove(images, $2), updated_at = now()
      WHERE id = $1 AND $2 = ANY(images) RETURNING images`,
    [productId, key],
  );
  if (!rows[0]) return { ok: false, reason: 'not_found' };
  if (key.startsWith('products/') && isValidKey(key)) {
    const still = await db().query('SELECT 1 FROM products WHERE $1 = ANY(images) LIMIT 1', [key]);
    if (still.rowCount === 0) await getStorage().remove(key);
  }
  return { ok: true, images: rows[0].images };
}
