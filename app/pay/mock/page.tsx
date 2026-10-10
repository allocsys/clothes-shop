import { notFound } from 'next/navigation';
import { getProvider } from '@/lib/payments';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'درگاه آزمایشی', robots: { index: false, follow: false } };

// FAKE gateway page (testing only). Hidden unless the mock provider is allowed.
export default async function MockGateway({ searchParams }: { searchParams: Promise<{ ref?: string; order?: string; amount?: string }> }) {
  if (!getProvider('mock')) notFound();
  const { ref = '', order = '', amount = '' } = await searchParams;
  if (!/^MOCK[0-9A-F]{16}$/.test(ref)) notFound();
  const cb = (status: string) => `/api/pay/callback/mock?ref=${encodeURIComponent(ref)}&status=${status}`;
  const n = Number(amount);
  return (
    <div className='mx-auto max-w-sm pt-10 text-center'>
      <p className='rounded-xl bg-rose/10 p-2 text-xs font-bold text-rose'>درگاه آزمایشی — هیچ پولی برداشت نمی‌شود</p>
      <h1 className='mt-5 text-lg font-bold'>پرداخت سفارش {order.slice(0, 20)}</h1>
      <p className='mt-2 text-2xl font-bold text-brand'>{Number.isFinite(n) ? new Intl.NumberFormat('fa-IR').format(n) : ''} تومان</p>
      <div className='mt-6 grid gap-3'>
        <a href={cb('OK')} className='rounded-2xl bg-brand py-3 font-bold text-white'>پرداخت موفق</a>
        <a href={cb('NOK')} className='rounded-2xl bg-surface py-3 font-bold'>انصراف</a>
      </div>
    </div>
  );
}
