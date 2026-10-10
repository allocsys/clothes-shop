// Tiny in-memory limiter for WRONG guesses (fine for one server; same idea as the admin login).
// Only failures are counted, so a customer who types everything right is never blocked.

type Entry = { count: number; resetAt: number };
const g = globalThis as unknown as { __failLimits?: Map<string, Entry> };
const store = (g.__failLimits ??= new Map<string, Entry>());

export function clientIp(req: Request): string {
  return req.headers.get('x-forwarded-for')?.split(',')[0].trim() || req.headers.get('x-real-ip') || 'unknown';
}

export function isBlocked(key: string, max: number): boolean {
  const e = store.get(key);
  return Boolean(e && e.resetAt > Date.now() && e.count >= max);
}

export function recordFail(key: string, windowMs: number): void {
  const now = Date.now();
  // Keep memory small: forget expired entries once the map grows, and never let it grow without limit.
  if (store.size > 1000) {
    for (const [k, v] of store) if (v.resetAt <= now) store.delete(k);
    if (store.size > 50000) store.clear();
  }
  const e = store.get(key);
  if (e && e.resetAt > now) e.count += 1;
  else store.set(key, { count: 1, resetAt: now + windowMs });
}
