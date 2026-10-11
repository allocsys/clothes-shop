import Link from 'next/link';
import { hasDb } from '@/lib/db';
import { getAnalytics, parseDays, type AnalyticsReport } from '@/lib/adminAnalytics';
import { getProductsBySlugs } from '@/lib/products';

export const dynamic = 'force-dynamic';

const fa = (n: number) => new Intl.NumberFormat('fa-IR').format(n);
const dayFmt = new Intl.DateTimeFormat('fa-IR', { day: 'numeric', month: 'short', timeZone: 'UTC' });
const dayLabel = (d: string) => dayFmt.format(new Date(d + 'T12:00:00Z'));

const FUNNEL_LABEL: Record<string, string> = {
  product_view: 'دیدن محصول',
  add_to_cart: 'افزودن به سبد',
  checkout_start: 'ثبت فرم خرید',
  order_placed: 'سفارش ثبت‌شده',
  order_paid: 'سفارش پرداخت‌شده',
};
const DEVICE_LABEL: Record<string, string> = { mobile: 'موبایل', tablet: 'تبلت', desktop: 'رایانه' };
const SOURCE_LABEL: Record<string, string> = {
  direct: 'مستقیم',
  instagram: 'اینستاگرام',
  telegram: 'تلگرام',
  google: 'گوگل',
  bing: 'بینگ',
  yandex: 'یاندکس',
  eitaa: 'ایتا',
};

export default async function AnalyticsPage({ searchParams }: { searchParams: Promise<{ days?: string | string[] }> }) {
  const days = parseDays((await searchParams).days);
  let data: AnalyticsReport | null = null;
  let titles = new Map<string, string>();
  if (hasDb()) {
    try {
      data = await getAnalytics(days);
      const list = await getProductsBySlugs(data.topProducts.map((p) => p.slug));
      titles = new Map(list.map((p) => [p.slug, p.title]));
    } catch {
      data = null;
    }
  }

  return (
    <div>
      <Link href='/admin' className='text-sm text-ink/60'>→ پنل مدیریت</Link>
      <h1 className='mt-2 text-xl font-bold'>آمار بازدید</h1>
      <p className='mt-1 text-xs leading-6 text-ink/50'>
        بدون کوکی و بدون ذخیره آی‌پی. «بازدید» یعنی یک بازدیدکننده در یک روز (به وقت تهران)؛ کسی بین روزها دنبال نمی‌شود. ربات‌ها شمرده نمی‌شوند.
      </p>

      <div className='mt-4 flex gap-2'>
        {[7, 30, 90].map((d) => (
          <Link
            key={d}
            href={`/admin/analytics?days=${d}`}
            className={'rounded-full border px-4 py-2.5 text-sm ' + (d === days ? 'border-brand bg-brand text-white' : 'border-ink/15 bg-surface')}
          >
            {fa(d)} روز
          </Link>
        ))}
      </div>

      {!data ? (
        <p className='mt-6 text-sm text-ink/60'>دیتابیس وصل نیست یا خواندن آمار ناموفق بود.</p>
      ) : (
        <>
          <div className='mt-5 grid grid-cols-2 gap-3'>
            <div className='rounded-2xl bg-surface p-4'>
              <p className='text-sm text-ink/60'>بازدید</p>
              <p className='mt-1 text-lg font-bold text-brand'>{fa(data.visits)}</p>
            </div>
            <div className='rounded-2xl bg-surface p-4'>
              <p className='text-sm text-ink/60'>صفحه دیده‌شده</p>
              <p className='mt-1 text-lg font-bold text-brand'>{fa(data.pageviews)}</p>
            </div>
          </div>

          <h2 className='mt-8 font-bold'>بازدید روزانه</h2>
          <DayBars rows={data.perDay.slice(0, 14)} />

          <h2 className='mt-8 font-bold'>مسیر خرید</h2>
          <Funnel rows={data.funnel} />

          <h2 className='mt-8 font-bold'>منبع ورود</h2>
          <Rows rows={data.sources.map((s) => [SOURCE_LABEL[s.source] ?? s.source, fa(s.visits)])} empty='هنوز داده‌ای نیست.' />

          <h2 className='mt-8 font-bold'>دستگاه</h2>
          <Rows rows={data.devices.map((d) => [DEVICE_LABEL[d.device] ?? d.device, fa(d.visits)])} empty='هنوز داده‌ای نیست.' />

          <h2 className='mt-8 font-bold'>صفحه‌های پربازدید</h2>
          <Rows rows={data.topPages.map((p) => [p.path, fa(p.views)])} empty='هنوز داده‌ای نیست.' ltrLabel />

          <h2 className='mt-8 font-bold'>محصولات پربازدید</h2>
          <Rows
            rows={data.topProducts.map((p) => [titles.get(p.slug) ?? p.slug, `${fa(p.views)} بازدید · ${fa(p.carts)} سبد`])}
            empty='هنوز داده‌ای نیست.'
          />

          <h2 className='mt-8 font-bold'>جستجوها</h2>
          <Rows rows={data.searches.map((s) => [s.query, `${fa(s.count)} بار · ${fa(s.avgResults)} نتیجه`])} empty='هنوز جستجویی ثبت نشده.' />

          <h2 className='mt-8 font-bold'>جستجوهای بدون نتیجه</h2>
          <p className='mt-1 text-xs text-ink/50'>چیزهایی که مشتری‌ها می‌خواهند و فروشگاه ندارد.</p>
          <Rows rows={data.zeroSearches.map((s) => [s.query, fa(s.count) + ' بار'])} empty='جستجوی بی‌نتیجه‌ای نبوده.' />
        </>
      )}
    </div>
  );
}

function Rows({ rows, empty, ltrLabel }: { rows: string[][]; empty: string; ltrLabel?: boolean }) {
  if (rows.length === 0) return <p className='mt-3 text-sm text-ink/60'>{empty}</p>;
  return (
    <ul className='mt-3 space-y-2'>
      {rows.map(([label, value], i) => (
        <li key={i} className='flex items-center justify-between gap-3 rounded-2xl bg-surface p-3 text-sm'>
          <span className='min-w-0 truncate' dir={ltrLabel ? 'ltr' : undefined}>{label}</span>
          <span className='shrink-0 text-xs text-ink/70'>{value}</span>
        </li>
      ))}
    </ul>
  );
}

function DayBars({ rows }: { rows: { day: string; visits: number; pageviews: number }[] }) {
  if (rows.length === 0) return <p className='mt-3 text-sm text-ink/60'>هنوز داده‌ای نیست.</p>;
  const max = Math.max(1, ...rows.map((d) => d.visits));
  return (
    <ul className='mt-3 space-y-1.5'>
      {rows.map((d) => (
        <li key={d.day} className='flex items-center gap-2 text-xs'>
          <span className='w-14 shrink-0 text-ink/60'>{dayLabel(d.day)}</span>
          <span className='h-3 flex-1 overflow-hidden rounded-full bg-surface'>
            <span className='block h-full rounded-full bg-brand' style={{ width: `${(d.visits / max) * 100}%` }} />
          </span>
          <span className='w-20 shrink-0 text-end text-ink/70'>{fa(d.visits)} · {fa(d.pageviews)}</span>
        </li>
      ))}
    </ul>
  );
}

function Funnel({ rows }: { rows: { event: string; visits: number }[] }) {
  const max = Math.max(1, ...rows.map((r) => r.visits));
  return (
    <ul className='mt-3 space-y-2'>
      {rows.map((r, i) => {
        const prev = i > 0 ? rows[i - 1].visits : 0;
        return (
          <li key={r.event} className='rounded-2xl bg-surface p-3 text-sm'>
            <div className='flex items-center justify-between gap-3'>
              <span>{FUNNEL_LABEL[r.event] ?? r.event}</span>
              <span className='text-xs text-ink/70'>
                {fa(r.visits)}
                {i > 0 && prev > 0 && <span className='mr-2 text-ink/50'>({fa(Math.round((r.visits / prev) * 100))}٪ از مرحله قبل)</span>}
              </span>
            </div>
            <span className='mt-2 block h-2 overflow-hidden rounded-full bg-ink/10'>
              <span className='block h-full rounded-full bg-brand' style={{ width: `${(r.visits / max) * 100}%` }} />
            </span>
          </li>
        );
      })}
    </ul>
  );
}
