import TrackForm from '@/components/TrackForm';
import { normalizeOrderCode, isOrderCode } from '@/lib/orderCode';

export const metadata = { title: 'پیگیری سفارش', robots: { index: false, follow: false } };

// ?code= fills in the code field (the order page links here). The mobile number is never put in the address.
export default async function TrackPage({ searchParams }: { searchParams: Promise<{ code?: string }> }) {
  const { code } = await searchParams;
  const initial = typeof code === 'string' ? normalizeOrderCode(code.slice(0, 30)) : '';
  return (
    <section className='mx-auto mt-8 max-w-md'>
      <h1 className='text-xl font-bold'>پیگیری سفارش</h1>
      <p className='mt-2 mb-5 text-sm leading-7 text-ink/70'>کد پیگیری سفارش و شماره موبایلی که هنگام خرید وارد کرده‌اید را وارد کنید.</p>
      <TrackForm initialCode={isOrderCode(initial) ? initial : ''} />
    </section>
  );
}
