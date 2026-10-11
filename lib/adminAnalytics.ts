import { db } from '@/lib/db';

// Numbers for /admin/analytics. A "visit" = one visitor hash on one Tehran day (the hash changes every day, so nobody is followed across days).

export type AnalyticsReport = {
  days: number;
  pageviews: number;
  visits: number;
  perDay: { day: string; visits: number; pageviews: number }[];
  topPages: { path: string; views: number }[];
  topProducts: { slug: string; views: number; carts: number }[];
  sources: { source: string; visits: number }[];
  devices: { device: string; visits: number }[];
  funnel: { event: string; visits: number }[];
  searches: { query: string; count: number; avgResults: number }[];
  zeroSearches: { query: string; count: number }[];
};

const DAY = "(created_at AT TIME ZONE 'Asia/Tehran')::date";
const VISIT = `(${DAY}::text || visitor)`;
export const FUNNEL = ['product_view', 'add_to_cart', 'checkout_start', 'order_placed', 'order_paid'] as const;

export function parseDays(v: unknown): number {
  const n = Number(Array.isArray(v) ? v[0] : v);
  return n === 30 || n === 90 ? n : 7;
}

export async function getAnalytics(days: number): Promise<AnalyticsReport> {
  const since = [days];
  const W = "created_at >= now() - ($1::int * interval '1 day')";
  const q = <T,>(sql: string) => db().query(sql, since).then((r) => r.rows as T[]);

  const [tot, perDay, pages, prods, src, dev, fun, srch, zero] = await Promise.all([
    q<{ pageviews: number; visits: number }>(
      `SELECT count(*)::int AS pageviews, count(DISTINCT ${VISIT})::int AS visits FROM analytics_events WHERE event = 'pageview' AND ${W}`,
    ),
    q<{ day: string; visits: number; pageviews: number }>(
      `SELECT ${DAY}::text AS day, count(DISTINCT visitor)::int AS visits, count(*)::int AS pageviews
         FROM analytics_events WHERE event = 'pageview' AND ${W} GROUP BY 1 ORDER BY 1 DESC`,
    ),
    q<{ path: string; views: number }>(
      `SELECT path, count(*)::int AS views FROM analytics_events
        WHERE event = 'pageview' AND path NOT LIKE '/order/%' AND ${W} GROUP BY path ORDER BY views DESC, path LIMIT 8`,
    ),
    q<{ slug: string; views: number; carts: number }>(
      `SELECT product_slug AS slug,
              count(*) FILTER (WHERE event = 'product_view')::int AS views,
              count(*) FILTER (WHERE event = 'add_to_cart')::int AS carts
         FROM analytics_events
        WHERE event IN ('product_view', 'add_to_cart') AND product_slug IS NOT NULL AND ${W}
        GROUP BY product_slug ORDER BY views DESC, carts DESC LIMIT 8`,
    ),
    q<{ source: string; visits: number }>(
      `SELECT source, count(DISTINCT ${VISIT})::int AS visits FROM analytics_events
        WHERE event = 'pageview' AND source IS NOT NULL AND ${W} GROUP BY source ORDER BY visits DESC, source LIMIT 8`,
    ),
    q<{ device: string; visits: number }>(
      `SELECT device, count(DISTINCT ${VISIT})::int AS visits FROM analytics_events
        WHERE event = 'pageview' AND device IS NOT NULL AND ${W} GROUP BY device ORDER BY visits DESC`,
    ),
    q<{ event: string; visits: number }>(
      `SELECT event, count(DISTINCT ${VISIT})::int AS visits FROM analytics_events
        WHERE event IN ('product_view', 'add_to_cart', 'checkout_start', 'order_placed', 'order_paid') AND ${W} GROUP BY event`,
    ),
    q<{ query: string; count: number; avg: number }>(
      `SELECT lower(query) AS query, count(*)::int AS count, round(avg(results))::int AS avg FROM analytics_events
        WHERE event = 'search' AND query IS NOT NULL AND ${W} GROUP BY lower(query) ORDER BY count DESC, query LIMIT 8`,
    ),
    q<{ query: string; count: number }>(
      `SELECT lower(query) AS query, count(*)::int AS count FROM analytics_events
        WHERE event = 'search' AND query IS NOT NULL AND results = 0 AND ${W} GROUP BY lower(query) ORDER BY count DESC, query LIMIT 8`,
    ),
  ]);

  const byEvent = new Map(fun.map((r) => [r.event, r.visits]));
  return {
    days,
    pageviews: tot[0]?.pageviews ?? 0,
    visits: tot[0]?.visits ?? 0,
    perDay,
    topPages: pages,
    topProducts: prods,
    sources: src,
    devices: dev,
    funnel: FUNNEL.map((event) => ({ event, visits: byEvent.get(event) ?? 0 })),
    searches: srch.map((r) => ({ query: r.query, count: r.count, avgResults: r.avg ?? 0 })),
    zeroSearches: zero,
  };
}
