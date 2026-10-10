import { db } from '@/lib/db';
import { STATUSES, type OrderStatus } from '@/lib/orderStatus';

// Sales overview for the admin. "Sales" = every order that is not canceled.
// Days are Tehran days (a late-night order counts for the day the owner sees on the clock).

export type Period = { orders: number; revenue: number };
export type DayRow = { day: string; orders: number; revenue: number }; // day = YYYY-MM-DD (Tehran)
export type TopProduct = { slug: string; title: string; qty: number; revenue: number };

export type SalesOverview = {
  today: Period;
  week: Period; // last 7 days including today
  month: Period; // last 30 days including today
  all: Period;
  days: DayRow[]; // last 14 days, oldest first, zero-filled
  byStatus: Record<OrderStatus, number>;
  top: TopProduct[]; // last 30 days, by pieces sold
};

const TZ = `'Asia/Tehran'`;
const TODAY = `(now() AT TIME ZONE ${TZ})::date`;
const DAY = `(o.created_at AT TIME ZONE ${TZ})::date`;

export async function getSalesOverview(): Promise<SalesOverview> {
  const pool = db();
  const [per, days, st, top] = await Promise.all([
    pool.query(`
      SELECT
        count(*) FILTER (WHERE ${DAY} = ${TODAY})::int                               AS t_n,
        COALESCE(sum(o.total) FILTER (WHERE ${DAY} = ${TODAY}), 0)::bigint           AS t_r,
        count(*) FILTER (WHERE ${DAY} > ${TODAY} - 7)::int                           AS w_n,
        COALESCE(sum(o.total) FILTER (WHERE ${DAY} > ${TODAY} - 7), 0)::bigint       AS w_r,
        count(*) FILTER (WHERE ${DAY} > ${TODAY} - 30)::int                          AS m_n,
        COALESCE(sum(o.total) FILTER (WHERE ${DAY} > ${TODAY} - 30), 0)::bigint      AS m_r,
        count(*)::int                                                                AS a_n,
        COALESCE(sum(o.total), 0)::bigint                                            AS a_r
      FROM orders o WHERE o.status <> 'canceled'`),
    pool.query(`
      SELECT to_char(g.d, 'YYYY-MM-DD') AS day, COALESCE(x.n, 0)::int AS n, COALESCE(x.r, 0)::bigint AS r
      FROM generate_series(${TODAY} - 13, ${TODAY}, interval '1 day') AS g(d)
      LEFT JOIN (
        SELECT ${DAY} AS d, count(*) AS n, sum(o.total) AS r
        FROM orders o WHERE o.status <> 'canceled' GROUP BY 1
      ) x ON x.d = g.d::date
      ORDER BY g.d`),
    pool.query(`SELECT status, count(*)::int AS n FROM orders GROUP BY status`),
    pool.query(`
      SELECT i.product_slug AS slug, max(i.title) AS title, sum(i.qty)::int AS qty, sum(i.qty * i.unit_price)::bigint AS revenue
      FROM order_items i JOIN orders o ON o.id = i.order_id
      WHERE o.status <> 'canceled' AND ${DAY} > ${TODAY} - 30
      GROUP BY i.product_slug
      ORDER BY qty DESC, revenue DESC, slug
      LIMIT 5`),
  ]);

  const p = per.rows[0];
  const byStatus = Object.fromEntries(STATUSES.map((s) => [s, 0])) as Record<OrderStatus, number>;
  for (const r of st.rows) if (r.status in byStatus) byStatus[r.status as OrderStatus] = r.n;

  return {
    today: { orders: p.t_n, revenue: Number(p.t_r) },
    week: { orders: p.w_n, revenue: Number(p.w_r) },
    month: { orders: p.m_n, revenue: Number(p.m_r) },
    all: { orders: p.a_n, revenue: Number(p.a_r) },
    days: days.rows.map((r) => ({ day: r.day, orders: r.n, revenue: Number(r.r) })),
    byStatus,
    top: top.rows.map((r) => ({ slug: r.slug, title: r.title, qty: r.qty, revenue: Number(r.revenue) })),
  };
}
