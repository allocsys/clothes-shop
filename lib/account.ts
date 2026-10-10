import { db } from '@/lib/db';

// Customer profile helpers.
export const NAME_MIN = 2;
export const NAME_MAX = 60;

// Returns the cleaned name, or null when it is not usable (too short, too long, not text).
export function cleanName(input: unknown): string | null {
  if (typeof input !== 'string') return null;
  const s = input.replace(/[\u0000-\u001f\u007f<>]/g, ' ').replace(/\s+/g, ' ').trim();
  return s.length >= NAME_MIN && s.length <= NAME_MAX ? s : null;
}

export async function updateCustomerName(customerId: number, name: string): Promise<void> {
  await db().query(`UPDATE customers SET name = $2 WHERE id = $1`, [customerId, name]);
}
