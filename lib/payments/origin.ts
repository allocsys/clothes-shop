// The public address of the shop, used to build the callback URL the gateway sends customers back to.
// Set SITE_URL (e.g. https://mahpari.ir) in production. Without it we use the proxy headers of the request.
export function siteOrigin(req: Request): string {
  const fixed = (process.env.SITE_URL ?? '').trim().replace(/\/+$/, '');
  if (/^https?:\/\/[^/\s]+$/.test(fixed)) return fixed;
  const h = req.headers;
  const host = h.get('x-forwarded-host') ?? h.get('host') ?? 'localhost:3000';
  const proto = h.get('x-forwarded-proto')?.split(',')[0].trim() ?? (host.startsWith('localhost') ? 'http' : 'https');
  return `${proto}://${host.split(',')[0].trim()}`;
}
