import Link from 'next/link';
import { hasDb } from '@/lib/db';
import { getSalesOverview } from '@/lib/adminStats';
import { STATUSES, STATUS_LABEL } from '@/lib/orderStatus';
import { formatPrice } from '@/lib/format';

export const dynamic = 'force-dynamic';

const fa = (n: number) => new Intl.NumberFormat('fa-IR').format(n);
const dayFmt = new Intl.DateTimeFormat('fa-IR', { day: 'numeric', month: 'short', timeZone: 'UTC' });
const dayLabel = (d: string) => dayFmt.format(new Date(d + 'T12:00:00Z'));

export default async function SalesPage() {
  let data = null;
  if (hasDb()) {
    try {
      data = await getSalesOverview();
    } catch {
      data = null;
    }
  }

  return (
    <div>
      <Link href='/admin' className='text-sm text-ink/60'>→ پنل مدیریت</Link>
      <h1 className='mt-2 text-xl font-bold'>نمای کلی فروش</h1>
      <p className='mt-1 text-xs text-ink/50'>سفارش‌های لغوشده حساب نمی‌شوند. روزها به وقت تهران‌اند.</p>

      {!data ? (
        <p className='mt-6 text-sm text-ink/60'>دیتابیس وصل نیست یا خواندن آمار ناموفق بود.</p>
      ) : (
        <>
          <div className='mt-5 grid grid-cols-2 gap-3'>
            {([
              ['امروز', data.today],
              ['۷ روز اخیر', data.week],
              ['۳۰ روز اخیر', data.month],
              ['از ابتدا', data.all],
            ] as const).map(([label, p]) => (
              <div key={label} className='rounded-2xl bg-surface p-4'>
                <p className='text-sm text-ink/60'>{label}</p>
                <p className='mt-1 text-base font-bold text-brand'>{formatPrice(p.revenue)}</p>
                <p className='mt-1 text-xs text-ink/60'>{fa(p.orders)} سفارش</p>
              </div>
            ))}
          </div>

          <h2 className='mt-8 font-bold'>۱۴ روز اخیر</h2>
          <DayBars days={data.days} />

          <h2 className='mt-8 font-bold'>وضعیت سفارش‌ها</h2>
          <div className='mt-3 flex flex-wrap gap-2'>
            {STATUSES.map((s) => (
              <Link key={s} href={`/admin/orders?status=${s}`} className='rounded-full bg-surface px-3 py-1.5 text-sm'>
                {STATUS_LABEL[s]} <span className='font-bold'>{fa(data.byStatus[s])}</span>
              </Link>
            ))}
          </div>

          <h2 className='mt-8 font-bold'>پرفروش‌ترین‌ها (۳۰ روز اخیر)</h2>
          {data.top.length === 0 ? (
            <p className='mt-3 text-sm text-ink/60'>هنوز فروشی ثبت نشده.</p>
          ) : (
            <ol className='mt-3 space-y-2'>
              {data.top.map((t, i) => (
                <li key={t.slug} className='flex items-center justify-between gap-3 rounded-2xl bg-surface p-3 text-sm'>
                  <span className='min-w-0 truncate'>{fa(i + 1)}. {t.title}</span>
                  <span className='shrink-0 text-xs text-ink/60'>{fa(t.qty)} عدد · {formatPrice(t.revenue)}</span>
                </li>
              ))}
            </ol>
          )}
        </>
      )}
    </div>
  );
}

function DayBars({ days }: { days: { day: string; orders: number; revenue: number }[] }) {
  const max = Math.max(1, ...days.map((d) => d.revenue));
  return (
    <ul className='mt-3 space-y-1.5'>
      {[...days].reverse().map((d) => (
        <li key={d.day} className='flex items-center gap-2 text-xs'>
          <span className='w-14 shrink-0 text-ink/60'>{dayLabel(d.day)}</span>
          <span className='h-3 flex-1 overflow-hidden rounded-full bg-surface'>
            <span className='block h-full rounded-full bg-brand' style={{ width: `${(d.revenue / max) * 100}%` }} />
          </span>
          <span className='w-24 shrink-0 text-end text-ink/70'>{d.orders ? `${fa(d.orders)} · ${fa(d.revenue)}` : '—'}</span>
        </li>
      ))}
    </ul>
  );
}
