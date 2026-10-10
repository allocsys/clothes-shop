import Link from 'next/link';

export const metadata = { title: 'صفحه پیدا نشد' };

// Shown for every unknown address and every notFound() call (hidden product, wrong order code, ...).
export default function NotFound() {
  return (
    <section className='mx-auto mt-10 max-w-md rounded-3xl bg-surface p-8 text-center'>
      <p aria-hidden='true' className='text-6xl font-bold text-brand/30'>۴۰۴</p>
      <h1 className='mt-3 text-xl font-bold'>صفحه پیدا نشد</h1>
      <p className='mt-2 text-sm leading-7 text-ink/70'>آدرسی که وارد کرده‌اید وجود ندارد یا جابه‌جا شده است.</p>
      <div className='mt-6 flex flex-wrap justify-center gap-3'>
        <Link href='/shop' className='rounded-full bg-brand px-8 py-3 font-bold text-white'>مشاهده محصولات</Link>
        <Link href='/' className='rounded-full border border-ink/15 px-8 py-3 font-bold'>صفحه اصلی</Link>
      </div>
    </section>
  );
}
