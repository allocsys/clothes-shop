import Link from 'next/link';
import { notFound } from 'next/navigation';
import OrderStatusActions from '@/components/admin/OrderStatusActions';
import OrderStatusBadge from '@/components/admin/OrderStatusBadge';
import PaymentBadge from '@/components/admin/PaymentBadge';
import RefundDoneButton from '@/components/admin/RefundDoneButton';
import { formatDateTime } from '@/lib/adminDate';
import { getOrder } from '@/lib/adminOrders';
import { hasDb } from '@/lib/db';
import { formatPrice } from '@/lib/format';

export const dynamic = 'force-dynamic';

export default async function AdminOrderPage({ params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id);
  if (!hasDb() || !Number.isInteger(id) || id <= 0) notFound();
  const o = await getOrder(id);
  if (!o) notFound();
  const fa = (n: number) => new Intl.NumberFormat('fa-IR').format(n);

  return (
    <div>
      <Link href='/admin/orders' className='text-sm text-brand'>← سفارش‌ها</Link>
      <div className='mt-3 flex items-center justify-between gap-2'>
        <h1 className='text-xl font-bold' dir='ltr'>{o.code}</h1>
        <span className='flex items-center gap-1.5'>
          <PaymentBadge paid={o.paid} attempts={o.payments.length} needsRefund={o.payments.some((p) => p.needsRefund)} />
          <OrderStatusBadge status={o.status} />
        </span>
      </div>
      <p className='mt-1 text-sm text-ink/60'>{formatDateTime(o.createdAt)}</p>

      <OrderStatusActions orderId={o.id} status={o.status} />

      <section className='mt-6 rounded-2xl bg-surface p-4'>
        <h2 className='font-bold'>مشتری</h2>
        <p className='mt-2'>{o.customerName}</p>
        <p className='mt-1'>
          <a href={'tel:' + o.mobile} dir='ltr' className='text-brand'>{o.mobile}</a>
        </p>
        <p className='mt-2 text-sm'>{o.city}{o.postalCode ? ' · کدپستی ' : ''}{o.postalCode && <span dir='ltr'>{o.postalCode}</span>}</p>
        <p className='mt-1 whitespace-pre-line text-sm'>{o.address}</p>
        {o.note && <p className='mt-3 rounded-xl bg-ink/5 p-3 text-sm'><span className='font-bold'>توضیح مشتری: </span>{o.note}</p>}
      </section>

      <section className='mt-4 rounded-2xl bg-surface p-4'>
        <h2 className='font-bold'>کالاها</h2>
        <ul className='mt-2 divide-y divide-ink/10'>
          {o.items.map((i, n) => (
            <li key={n} className='flex items-start justify-between gap-3 py-3'>
              <div className='min-w-0'>
                <Link href={'/product/' + i.slug} target='_blank' className='font-bold'>{i.title}</Link>
                <p className='mt-0.5 text-sm text-ink/60'>سایز <span dir='ltr'>{i.size}</span> · {i.color}</p>
              </div>
              <div className='shrink-0 text-end text-sm'>
                <p>{fa(i.qty)} × {formatPrice(i.unitPrice)}</p>
                <p className='font-bold'>{formatPrice(i.qty * i.unitPrice)}</p>
              </div>
            </li>
          ))}
        </ul>
        <dl className='mt-2 space-y-1 border-t border-ink/10 pt-3 text-sm'>
          <div className='flex justify-between'><dt>جمع کالاها</dt><dd>{formatPrice(o.subtotal)}</dd></div>
          <div className='flex justify-between'><dt>هزینهٔ ارسال</dt><dd>{o.shipping === 0 ? 'رایگان' : formatPrice(o.shipping)}</dd></div>
          <div className='flex justify-between text-base font-bold'><dt>مبلغ نهایی</dt><dd>{formatPrice(o.total)}</dd></div>
        </dl>
      </section>

      {o.payments.length > 0 && (
        <section className='mt-4 rounded-2xl bg-surface p-4'>
          <h2 className='font-bold'>پرداخت آنلاین</h2>
          <ul className='mt-2 divide-y divide-ink/10'>
            {o.payments.map((p) => (
              <li key={p.id} className='py-3 text-sm'>
                <div className='flex items-center justify-between gap-2'>
                  <span className='font-bold'>{p.status === 'paid' ? 'موفق' : p.status === 'failed' ? 'ناموفق' : 'در انتظار'} · {formatPrice(p.amount)}</span>
                  <span className='text-xs text-ink/60' dir='ltr'>{p.provider}</span>
                </div>
                <p className='mt-1 text-xs text-ink/60'>{formatDateTime(p.paidAt ?? p.createdAt)}</p>
                {p.gatewayRef && <p className='mt-1 text-xs'>شمارهٔ پیگیری درگاه: <span dir='ltr'>{p.gatewayRef}</span></p>}
                {p.cardMask && <p className='mt-1 text-xs'>کارت: <span dir='ltr'>{p.cardMask}</span></p>}
                {p.error && <p className='mt-1 text-xs text-rose' dir='auto'>{p.error}</p>}
                {p.needsRefund && (
                  <div className='mt-2 rounded-xl bg-rose/10 p-3'>
                    <p className='text-xs leading-6 text-rose'>این مبلغ از مشتری گرفته شده ولی سفارش انجام نمی‌شود. پول را در پنل درگاه برگردانید، بعد دکمهٔ زیر را بزنید.</p>
                    <RefundDoneButton paymentId={p.id} />
                  </div>
                )}
                {p.refundedAt && <p className='mt-1 text-xs text-ink/60'>بازپرداخت شد · {formatDateTime(p.refundedAt)}</p>}
              </li>
            ))}
          </ul>
        </section>
      )}

      <Link href={'/admin/orders/' + o.id + '/print'} target='_blank' className='mt-5 block rounded-full border border-ink/20 py-3 text-center text-sm'>
        چاپ برگهٔ بسته‌بندی
      </Link>
    </div>
  );
}
