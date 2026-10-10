'use client';

import { useEffect } from 'react';

// Shown when a page crashes while loading. Never prints the technical message (it can contain internal details).
export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error('PAGE_ERROR', error.digest ?? '', error.message);
  }, [error]);

  return (
    <section className='mx-auto mt-10 max-w-md rounded-3xl bg-surface p-8 text-center'>
      <p aria-hidden='true' className='text-6xl font-bold text-rose/40'>!</p>
      <h1 className='mt-3 text-xl font-bold'>مشکلی پیش آمد</h1>
      <p className='mt-2 text-sm leading-7 text-ink/70'>نمایش این صفحه با خطا روبه‌رو شد. دوباره تلاش کنید؛ اگر ادامه داشت کمی بعد سر بزنید.</p>
      <div className='mt-6 flex flex-wrap justify-center gap-3'>
        <button type='button' onClick={() => reset()} className='rounded-full bg-brand px-8 py-3 font-bold text-white'>تلاش دوباره</button>
        <a href='/' className='rounded-full border border-ink/15 px-8 py-3 font-bold'>صفحه اصلی</a>
      </div>
    </section>
  );
}
