import Link from 'next/link';
import OrderStatusBadge from '@/components/admin/OrderStatusBadge';
import PaymentBadge from '@/components/admin/PaymentBadge';
import { formatDateTime } from '@/lib/adminDate';
import { isStatus, listOrders, STATUS_LABEL, STATUSES, statusCounts } from '@/lib/adminOrders';
import { hasDb } from '@/lib/db';
import { formatPrice } from '@/lib/format';

export const dynamic = 'force-dynamic';

type SP = { status?: string; q?: string; page?: string };

export default async function AdminOrdersPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const fa = (n: number) => new Intl.NumberFormat('fa-IR').format(n);

  if (!hasDb()) {
    return (
      <div>
        <Link href='/admin' className='text-sm text-brand'>← پنل مدیریت</Link>
        <h1 className='mt-3 text-xl font-bold'>سفارش‌ها</h1>
        <p className='mt-4 rounded-2xl bg-surface p-4 text-sm text-ink/70'>مدیریت سفارش‌ها به دیتابیس نیاز دارد (DATABASE_URL).</p>
      </div>
    );
  }

  const status = isStatus(sp.status) ? sp.status : undefined;
  const q = (sp.q ?? '').trim();
  const page = Math.max(1, Math.floor(Number(sp.page) || 1));
  const [{ rows, hasMore }, counts] = await Promise.all([listOrders({ status, q, page }), statusCounts()]);
  const total = STATUSES.reduce((n, s) => n + counts[s], 0);

  const href = (over: Partial<SP>) => {
    const p = new URLSearchParams();
    const merged = { status, q: q || undefined, page: undefined as string | undefined, ...over };
    for (const [k, v] of Object.entries(merged)) if (v) p.set(k, String(v));
    const s = p.toString();
    return '/admin/orders' + (s ? '?' + s : '');
  };
  const chip = (active: boolean) =>
    'shrink-0 rounded-full border px-3.5 py-2 text-sm ' + (active ? 'border-brand bg-brand font-bold text-white' : 'border-ink/20');

  return (
    <div>
      <Link href='/admin' className='text-sm text-brand'>← پنل مدیریت</Link>
      <h1 className='mt-3 text-xl font-bold'>سفارش‌ها</h1>

      <form action='/admin/orders' className='mt-4 flex gap-2'>
        {status && <input type='hidden' name='status' value={status} />}
        <input
          name='q'
          defaultValue={q}
          placeholder='کد سفارش، موبایل یا نام'
          aria-label='جستجو در سفارش‌ها'
          className='min-w-0 flex-1 rounded-full border border-ink/15 bg-surface px-4 py-2.5 outline-none focus:border-brand'
        />
        <button type='submit' className='rounded-full bg-brand px-5 py-2.5 text-sm font-bold text-white'>جستجو</button>
      </form>

      <div className='-mx-4 mt-4 flex gap-2 overflow-x-auto px-4 pb-1'>
        <Link href={href({ status: undefined })} className={chip(!status)}>همه ({fa(total)})</Link>
        {STATUSES.map((s) => (
          <Link key={s} href={href({ status: s })} className={chip(status === s)}>
            {STATUS_LABEL[s]} ({fa(counts[s])})
          </Link>
        ))}
      </div>

      {rows.length === 0 && (
        <p className='mt-6 rounded-2xl bg-surface p-4 text-sm text-ink/70'>
          {q || status ? 'سفارشی با این فیلتر پیدا نشد.' : 'هنوز سفارشی ثبت نشده است.'}
        </p>
      )}

      <ul className='mt-4 space-y-3'>
        {rows.map((o) => (
          <li key={o.id}>
            <Link href={'/admin/orders/' + o.id} className='block rounded-2xl bg-surface p-4'>
              <div className='flex items-center justify-between gap-2'>
                <span className='font-bold' dir='ltr'>{o.code}</span>
                <span className='flex items-center gap-1.5'>
                  <PaymentBadge paid={o.paid} attempts={o.payAttempts} needsRefund={o.needsRefund} />
                  <OrderStatusBadge status={o.status} />
                </span>
              </div>
              <p className='mt-1 truncate'>{o.customerName} · {o.city}</p>
              <div className='mt-1 flex items-center justify-between gap-2 text-sm text-ink/60'>
                <span>{formatDateTime(o.createdAt)}</span>
                <span>{fa(o.itemCount)} عدد · {formatPrice(o.total)}</span>
              </div>
            </Link>
          </li>
        ))}
      </ul>

      {(page > 1 || hasMore) && (
        <div className='mt-5 flex items-center justify-between text-sm'>
          {hasMore ? <Link href={href({ page: String(page + 1) })} className='rounded-full border border-ink/20 px-4 py-2'>صفحهٔ بعد</Link> : <span />}
          {page > 1 && <Link href={href({ page: page > 2 ? String(page - 1) : undefined })} className='rounded-full border border-ink/20 px-4 py-2'>صفحهٔ قبل</Link>}
        </div>
      )}
    </div>
  );
}
