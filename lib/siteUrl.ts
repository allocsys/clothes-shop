// Public address of the shop, used for sitemap, robots, canonical links and structured data.
// Set SITE_URL on the server (Railway variable or VPS .env), e.g. https://mahpari.ir
// Until the real domain exists it falls back to the Railway staging address.
const FALLBACK = 'https://clothes-shop-production-d9d8.up.railway.app';

export function siteUrl(): string {
  const raw = (process.env.SITE_URL || process.env.NEXT_PUBLIC_SITE_URL || FALLBACK).trim();
  return raw.replace(/\/+$/, '');
}

// Turns "/shop" or "/media/products/a.webp" into a full address. Full URLs pass through.
export function absoluteUrl(path: string): string {
  if (/^https?:\/\//i.test(path)) return path;
  return siteUrl() + (path.startsWith('/') ? '' : '/') + path;
}
