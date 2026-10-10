import { createHash, randomBytes, randomInt, timingSafeEqual } from 'node:crypto';
import { db } from '@/lib/db';

// One-time login codes (6 digits, sent by SMS). Rules, all enforced here in the database so they survive restarts:
//  - a code works for 5 minutes and only once;
//  - 5 wrong guesses lock that code (the customer has to ask for a new one);
//  - a new code can be requested every 60 seconds, at most 5 per hour per mobile number;
//  - asking for a new code cancels the older one.
export const CODE_TTL_MINUTES = 5;
export const MAX_ATTEMPTS = 5;
export const RESEND_SECONDS = 60;
export const MAX_CODES_PER_HOUR = 5;

export type RequestResult =
  | { ok: true; id: number; code: string }
  | { ok: false; reason: 'cooldown'; waitSeconds: number }
  | { ok: false; reason: 'too_many' };

export type VerifyResult =
  | { ok: true; customerId: number; isNew: boolean }
  | { ok: false; reason: 'invalid'; attemptsLeft: number };

const hash = (salt: string, mobile: string, code: string) =>
  createHash('sha256').update(salt + ':' + mobile + ':' + code).digest('hex');

function sameHash(a: string, b: string): boolean {
  const x = Buffer.from(a, 'hex');
  const y = Buffer.from(b, 'hex');
  return x.length === y.length && timingSafeEqual(x, y);
}

// Creates a new code for the mobile number (or says why not). The caller sends `code` by SMS.
export async function requestCode(mobile: string): Promise<RequestResult> {
  const client = await db().connect();
  try {
    await client.query('BEGIN');
    // One request at a time per mobile number, so two parallel requests cannot both pass the checks.
    await client.query('SELECT pg_advisory_xact_lock(hashtext($1))', ['login:' + mobile]);

    const recent = await client.query(
      `SELECT GREATEST(0, CEIL(EXTRACT(EPOCH FROM (created_at + make_interval(secs => $2) - now()))))::int AS wait
         FROM login_codes WHERE mobile = $1 ORDER BY created_at DESC LIMIT 1`,
      [mobile, RESEND_SECONDS],
    );
    const wait = recent.rows[0]?.wait ?? 0;
    if (wait > 0) {
      await client.query('ROLLBACK');
      return { ok: false, reason: 'cooldown', waitSeconds: wait };
    }
    const hour = await client.query(
      `SELECT count(*)::int AS n FROM login_codes WHERE mobile = $1 AND created_at > now() - interval '1 hour'`,
      [mobile],
    );
    if (hour.rows[0].n >= MAX_CODES_PER_HOUR) {
      await client.query('ROLLBACK');
      return { ok: false, reason: 'too_many' };
    }

    await client.query(`UPDATE login_codes SET consumed_at = now() WHERE mobile = $1 AND consumed_at IS NULL`, [mobile]);
    const code = String(randomInt(0, 1_000_000)).padStart(6, '0');
    const salt = randomBytes(16).toString('hex');
    const ins = await client.query(
      `INSERT INTO login_codes (mobile, salt, code_hash, expires_at)
       VALUES ($1, $2, $3, now() + make_interval(mins => $4)) RETURNING id`,
      [mobile, salt, hash(salt, mobile, code), CODE_TTL_MINUTES],
    );
    await client.query('COMMIT');
    return { ok: true, id: ins.rows[0].id, code };
  } catch (e) {
    await client.query('ROLLBACK').catch(() => {});
    throw e;
  } finally {
    client.release();
  }
}

// The SMS could not be sent: drop the code so the customer can try again right away without waiting.
export async function discardCode(id: number): Promise<void> {
  await db().query(`DELETE FROM login_codes WHERE id = $1`, [id]);
}

// Checks a code. On success the code is used up and the customer account is created if it is the first login.
export async function verifyCode(mobile: string, code: string): Promise<VerifyResult> {
  const client = await db().connect();
  try {
    await client.query('BEGIN');
    await client.query('SELECT pg_advisory_xact_lock(hashtext($1))', ['login:' + mobile]);

    const cur = await client.query(
      `SELECT id, salt, code_hash, attempts FROM login_codes
        WHERE mobile = $1 AND consumed_at IS NULL AND expires_at > now()
        ORDER BY created_at DESC LIMIT 1`,
      [mobile],
    );
    const row = cur.rows[0];
    if (!row) {
      await client.query('COMMIT');
      return { ok: false, reason: 'invalid', attemptsLeft: 0 };
    }

    if (!sameHash(row.code_hash, hash(row.salt, mobile, code))) {
      const attempts = row.attempts + 1;
      const locked = attempts >= MAX_ATTEMPTS;
      await client.query(`UPDATE login_codes SET attempts = $2, consumed_at = CASE WHEN $3 THEN now() ELSE NULL END WHERE id = $1`, [row.id, attempts, locked]);
      await client.query('COMMIT');
      return { ok: false, reason: 'invalid', attemptsLeft: Math.max(0, MAX_ATTEMPTS - attempts) };
    }

    await client.query(`UPDATE login_codes SET consumed_at = now() WHERE id = $1`, [row.id]);
    const up = await client.query(
      `INSERT INTO customers (mobile, last_login_at) VALUES ($1, now())
       ON CONFLICT (mobile) DO UPDATE SET last_login_at = now()
       RETURNING id, (xmax = 0) AS is_new`,
      [mobile],
    );
    await client.query('COMMIT');
    return { ok: true, customerId: up.rows[0].id, isNew: up.rows[0].is_new };
  } catch (e) {
    await client.query('ROLLBACK').catch(() => {});
    throw e;
  } finally {
    client.release();
  }
}
