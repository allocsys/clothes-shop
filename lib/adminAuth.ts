// Admin login with ONE password, kept in the server setting ADMIN_PASSWORD (never in Git).
// After a correct password the browser gets a signed cookie (expiry + HMAC signature). The signing
// key is derived from the password, so changing ADMIN_PASSWORD logs everybody out.
// Uses only Web Crypto, so it works both in middleware.ts (Edge) and in route handlers (Node).
// If ADMIN_PASSWORD is not set, the admin area stays locked.

export const ADMIN_COOKIE = 'admin_session';
export const SESSION_SECONDS = 60 * 60 * 24 * 7; // stay logged in for 7 days

const enc = new TextEncoder();

export function adminEnabled(): boolean {
  return Boolean(process.env.ADMIN_PASSWORD);
}

function toBase64Url(buf: ArrayBuffer): string {
  let s = '';
  for (const b of new Uint8Array(buf)) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function signingKey(): Promise<CryptoKey | null> {
  const pw = process.env.ADMIN_PASSWORD;
  if (!pw) return null;
  const seed = await crypto.subtle.digest('SHA-256', enc.encode('mahpari-admin-session:' + pw));
  return crypto.subtle.importKey('raw', seed, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
}

async function sign(message: string): Promise<string | null> {
  const key = await signingKey();
  if (!key) return null;
  return toBase64Url(await crypto.subtle.sign('HMAC', key, enc.encode(message)));
}

// Compares two strings without stopping at the first difference
function sameString(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export async function checkPassword(input: string): Promise<boolean> {
  const pw = process.env.ADMIN_PASSWORD;
  if (!pw) return false;
  // Compare fixed-length signatures of both, so timing reveals neither the length nor the content
  const [a, b] = await Promise.all([sign('login:' + input), sign('login:' + pw)]);
  return a !== null && b !== null && sameString(a, b);
}

export async function createSession(): Promise<string | null> {
  const exp = Math.floor(Date.now() / 1000) + SESSION_SECONDS;
  const sig = await sign('session:' + exp);
  return sig ? exp + '.' + sig : null;
}

export async function verifySession(token: string | undefined | null): Promise<boolean> {
  if (!token) return false;
  const [exp, sig] = token.split('.');
  const expNum = Number(exp);
  if (!sig || !Number.isInteger(expNum) || expNum < Math.floor(Date.now() / 1000)) return false;
  const expected = await sign('session:' + expNum);
  return expected !== null && sameString(sig, expected);
}
