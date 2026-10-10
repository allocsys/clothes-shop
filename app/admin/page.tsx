import Link from 'next/link';
import LogoutButton from '@/components/admin/LogoutButton';
import { db, hasDb } from '@/lib/db';
import { refundCount } from '@/lib/adminPayments';

export const dynamic = 'force-dynamic';

async function counts(): Promise<{ products: number; orders: number; fresh: number; refunds: number } | null> {
  if (!hasDb()) return null;
  try {
    const [p, o, f, refunds] = await Promise.all([
      db().query('SELECT count(*)::int AS n FROM products'),
      db().query('SELECT count(*)::int AS n FROM orders'),
      db().query("SELECT count(*)::int AS n FROM orders WHERE status = 'new'"),
      refundCount(),
    ]);
    return { products: p.rows[0].n, orders: o.rows[0].n, fresh: f.rows[0].n, refunds };
  } catch {
    return null;
  }
}

export default async function AdminHome() {
  const c = await counts();
  const fa = (n: number) => new Intl.NumberFormat('fa-IR').format(n);
  return (
    <div>
      <div className='flex items-center justify-between'>
        <h1 className='text-xl font-bold'>پنل مدیریت ماه‌پری</h1>
        <LogoutButton />
      </div>

      <div className='mt-6 grid grid-cols-2 gap-3'>
        <Link href='/admin/products' className='rounded-2xl bg-surface p-4'>
          <p className='text-sm text-ink/60'>محصولات ←</p>
          <p className='mt-1 text-2xl font-bold text-brand'>{c ? fa(c.products) : '—'}</p>
        </Link>
        <Link href='/admin/orders' className='rounded-2xl bg-surface p-4'>
          <p className='text-sm text-ink/60'>سفارش‌ها ←</p>
          <p className='mt-1 text-2xl font-bold text-brand'>{c ? fa(c.orders) : '—'}</p>
          {c && c.fresh > 0 && <p className='mt-1 text-xs font-bold text-rose'>{fa(c.fresh)} سفارش جدید</p>}
          {c && c.refunds > 0 && <p className='mt-1 text-xs font-bold text-rose'>{fa(c.refunds)} بازپرداخت در انتظار</p>}
        </Link>
      </div>
      {!c && <p className='mt-3 text-sm text-ink/50'>دیتابیس وصل نیست؛ شمارنده‌ها خالی‌اند.</p>}

      <Link href='/admin/sales' className='mt-3 block rounded-2xl bg-surface p-4'>
        <p className='text-sm text-ink/60'>نمای کلی فروش ←</p>
        <p className='mt-1 text-xs text-ink/50'>امروز، ۷ و ۳۰ روز اخیر، نمودار روزانه، پرفروش‌ها</p>
      </Link>
    </div>
  );
}
