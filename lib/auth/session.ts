import { createHash, randomBytes } from 'node:crypto';
import { cookies } from 'next/headers';
import { db } from '@/lib/db';

// Customer login session: a random token in an httpOnly cookie. The database keeps only the token's hash,
// so a copy of the database cannot be used to log in, and logging out really ends the session.
export const CUSTOMER_COOKIE = 'customer_session';
export const SESSION_DAYS = 30;

export type Customer = { id: number; mobile: string; name: string };

const hashToken = (t: string) => createHash('sha256').update(t).digest('hex');

export const sessionCookieOptions = () => ({
  httpOnly: true,
  sameSite: 'lax' as const,
  secure: process.env.NODE_ENV === 'production',
  path: '/',
  maxAge: SESSION_DAYS * 24 * 60 * 60,
});

export async function createCustomerSession(customerId: number): Promise<string> {
  const token = randomBytes(32).toString('base64url');
  await db().query(
    `INSERT INTO customer_sessions (customer_id, token_hash, expires_at) VALUES ($1, $2, now() + make_interval(days => $3))`,
    [customerId, hashToken(token), SESSION_DAYS],
  );
  // Housekeeping: forget sessions that ran out.
  await db().query(`DELETE FROM customer_sessions WHERE expires_at < now()`).catch(() => {});
  return token;
}

export async function customerFromToken(token: string | undefined | null): Promise<Customer | null> {
  if (!token || token.length < 20 || token.length > 100) return null;
  const r = await db().query(
    `SELECT c.id, c.mobile, c.name FROM customer_sessions s JOIN customers c ON c.id = s.customer_id
      WHERE s.token_hash = $1 AND s.expires_at > now()`,
    [hashToken(token)],
  );
  return r.rows[0] ?? null;
}

export async function deleteCustomerSession(token: string | undefined | null): Promise<void> {
  if (!token) return;
  await db().query(`DELETE FROM customer_sessions WHERE token_hash = $1`, [hashToken(token)]);
}

// For server components and route handlers: the logged-in customer, or null.
export async function getCurrentCustomer(): Promise<Customer | null> {
  return customerFromToken((await cookies()).get(CUSTOMER_COOKIE)?.value);
}
