import Link from 'next/link';
import { notFound } from 'next/navigation';
import PayAgainForm from '@/components/PayAgainForm';
import { hasDb } from '@/lib/db';
import { getOrderSummary } from '@/lib/orders';
import { getActiveProvider } from '@/lib/payments';
import { formatPrice } from '@/lib/format';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'وضعیت سفارش', robots: { index: false, follow: false } };

// Shown when the customer comes back from the gateway. The database decides what is true; ?pay= only picks the wording.
export default async function OrderPage({ params, searchParams }: { params: Promise<{ code: string }>; searchParams: Promise<{ pay?: string }> }) {
  const { code: raw } = await params;
  const { pay } = await searchParams;
  const code = raw.toUpperCase();
  if (!hasDb() || !/^MP-[A-Z0-9]{8}$/.test(code)) notFound();
  const order = await getOrderSummary(code);
  if (!order) notFound();

  const paid = order.paymentStatus === 'paid';
  const canceled = order.status === 'canceled';
  const canPay = !paid && !canceled && getActiveProvider() !== null;

  return (
    <section className='mx-auto mt-10 max-w-md rounded-3xl bg-surface p-8 text-center'>
      {paid ? (
        <>
          <h1 className='text-xl font-bold text-brand'>پرداخت با موفقیت انجام شد</h1>
          {pay === 'review' && <p className='mt-2 text-xs leading-6 text-rose'>پرداخت شما ثبت شد، اما سفارش نیاز به بررسی دارد. فروشگاه با شما تماس می‌گیرد.</p>}
        </>
      ) : pay === 'cancelled' ? (
        <h1 className='text-xl font-bold'>پرداخت لغو شد</h1>
      ) : pay === 'failed' ? (
        <h1 className='text-xl font-bold text-rose'>پرداخت انجام نشد</h1>
      ) : pay === 'review' ? (
        <>
          <h1 className='text-xl font-bold'>پرداخت شما ثبت شد</h1>
          <p className='mt-2 text-xs leading-6 text-rose'>سفارش نیاز به بررسی دارد. فروشگاه با شما تماس می‌گیرد.</p>
        </>
      ) : (
        <h1 className='text-xl font-bold'>سفارش شما</h1>
      )}
      <p className='mt-3 text-sm text-ink/70'>کد پیگیری: <span className='font-bold text-brand' dir='ltr'>{order.code}</span></p>
      <p className='mt-1 text-sm text-ink/70'>مبلغ کل: {formatPrice(order.total)}</p>
      {canceled && <p className='mt-3 text-sm text-rose'>این سفارش لغو شده است.</p>}
      {!paid && !canceled && !canPay && <p className='mt-3 text-xs leading-6 text-ink/50'>سفارش شما ثبت شده است. فروشگاه برای هماهنگی با شما تماس می‌گیرد.</p>}
      {canPay && <PayAgainForm code={order.code} />}
      <Link href='/shop' className='mt-6 inline-block rounded-full bg-surface px-8 py-3 font-bold text-brand ring-1 ring-brand/30'>ادامه خرید</Link>
    </section>
  );
}
