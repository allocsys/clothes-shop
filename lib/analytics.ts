import { createHash } from 'node:crypto';
import { db, hasDb } from '@/lib/db';
import { clientIp } from '@/lib/rateLimit';

// First-party analytics. Stores the event type, page, product, traffic source and device class only.
// No IP address and no cookie is stored; `visitor` is a hash that changes every day.

export const CLIENT_EVENTS = ['pageview', 'product_view', 'add_to_cart', 'checkout_start', 'search'] as const;
export type ClientEvent = (typeof CLIENT_EVENTS)[number];
export type AnalyticsEvent = ClientEvent | 'order_placed' | 'order_paid';

type Row = {
  event: AnalyticsEvent;
  path: string;
  product_slug?: string | null;
  source?: string | null;
  medium?: string | null;
  campaign?: string | null;
  query?: string | null;
  results?: number | null;
};

// Crawlers, previews and monitors are not visitors. (Headless test browsers are counted on purpose, so CI can test the funnel.)
const BOT = /bot|crawl|spider|slurp|lighthouse|facebookexternalhit|preview|monitor|uptime|curl|wget|python|node-fetch|axios|go-http|java\//i;

export function isBot(ua: string): boolean {
  return !ua || BOT.test(ua);
}

export function deviceOf(ua: string): 'mobile' | 'tablet' | 'desktop' {
  if (/tablet|ipad/i.test(ua)) return 'tablet';
  if (/mobi|android|iphone/i.test(ua)) return 'mobile';
  return 'desktop';
}

// Day in Tehran time, used to rotate the visitor hash.
function tehranDay(): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Tehran' });
}

export function visitorHash(ip: string, ua: string): string {
  const salt = process.env.ANALYTICS_SALT || process.env.ADMIN_PASSWORD || 'mahpari';
  return createHash('sha256').update(salt + '|' + tehranDay() + '|' + ip + '|' + ua).digest('hex').slice(0, 16);
}

const clean = (v: unknown, max: number): string | null => {
  if (typeof v !== 'string') return null;
  const s = v.replace(/[\u0000-\u001f\u007f]/g, '').trim().slice(0, max);
  return s || null;
};

// Stored path: no query string, no hash, must be a shop page (admin and API are never tracked).
export function cleanPath(v: unknown): string | null {
  const s = clean(v, 300);
  if (!s || !s.startsWith('/') || s.startsWith('//')) return null;
  const p = s.split(/[?#]/)[0].slice(0, 200);
  if (!p || p.startsWith('/admin') || p.startsWith('/api')) return null;
  return p;
}

// Turns a referrer address into a short label (instagram, telegram, google...). Own site = null (not a new visit source).
export function sourceFromReferrer(referrer: unknown, ownHost: string): string | null {
  const r = clean(referrer, 300);
  if (!r) return 'direct';
  let host = '';
  try {
    host = new URL(r).hostname.toLowerCase().replace(/^www\./, '');
  } catch {
    return 'direct';
  }
  if (!host) return 'direct';
  if (host === ownHost.toLowerCase().replace(/^www\./, '').split(':')[0]) return null;
  if (/(^|\.)instagram\.com$/.test(host)) return 'instagram';
  if (/(^|\.)(t\.me|telegram\.org|telegram\.me)$/.test(host)) return 'telegram';
  if (/(^|\.)google\./.test(host)) return 'google';
  if (/(^|\.)bing\.com$/.test(host)) return 'bing';
  if (/(^|\.)yandex\./.test(host)) return 'yandex';
  if (/(^|\.)eitaa\.com$/.test(host)) return 'eitaa';
  return host.slice(0, 40);
}

async function insert(req: Request, row: Row): Promise<void> {
  if (!hasDb()) return;
  const ua = req.headers.get('user-agent') || '';
  if (isBot(ua)) return;
  try {
    await db().query(
      'INSERT INTO analytics_events (event, visitor, path, product_slug, source, medium, campaign, device, query, results) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)',
      [
        row.event,
        visitorHash(clientIp(req), ua),
        row.path,
        row.product_slug ?? null,
        row.source ?? null,
        row.medium ?? null,
        row.campaign ?? null,
        deviceOf(ua),
        row.query ?? null,
        row.results ?? null,
      ],
    );
    // Keep the table small: now and then drop events older than 400 days.
    if (Math.random() < 0.005) await db().query("DELETE FROM analytics_events WHERE created_at < now() - interval '400 days'");
  } catch (e) {
    console.error('ANALYTICS_INSERT_ERROR', e instanceof Error ? e.message : e);
  }
}

// An event sent by the browser (POST /api/a). Everything is validated and clamped here.
export async function trackClient(req: Request, body: any): Promise<void> {
  const event = body?.e;
  if (!(CLIENT_EVENTS as readonly string[]).includes(event)) return;
  const path = cleanPath(body?.path);
  if (!path) return;
  const slug = clean(body?.slug, 80);
  const results = Number.isInteger(body?.results) && body.results >= 0 && body.results <= 100000 ? (body.results as number) : null;
  const utmSource = clean(body?.utm_source, 40)?.toLowerCase() ?? null;
  await insert(req, {
    event,
    path,
    product_slug: slug && /^[a-z0-9-]+$/i.test(slug) ? slug : null,
    source: utmSource ?? (event === 'pageview' ? sourceFromReferrer(body?.ref, req.headers.get('host') || '') : null),
    medium: clean(body?.utm_medium, 40)?.toLowerCase() ?? null,
    campaign: clean(body?.utm_campaign, 60)?.toLowerCase() ?? null,
    query: event === 'search' ? clean(body?.query, 80) : null,
    results: event === 'search' ? results : null,
  });
}

// An event recorded by the server itself (orders and payments), so it cannot be faked from the browser.
// order_paid is stored once per path (the order page), because gateways may call back more than once.
export async function trackServer(req: Request, event: 'order_placed' | 'order_paid', path: string): Promise<void> {
  if (event === 'order_paid' && hasDb()) {
    try {
      const seen = await db().query("SELECT 1 FROM analytics_events WHERE event = 'order_paid' AND path = $1 LIMIT 1", [path]);
      if (seen.rows.length > 0) return;
    } catch {
      return;
    }
  }
  await insert(req, { event, path });
}
