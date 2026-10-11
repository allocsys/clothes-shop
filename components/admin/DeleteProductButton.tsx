'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

// Two taps: the first asks, the second deletes. Old orders keep their own copy of the product details.
export default function DeleteProductButton({ productId }: { productId: number }) {
  const router = useRouter();
  const [asking, setAsking] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function remove() {
    if (busy) return;
    setBusy(true);
    setError('');
    try {
      const res = await fetch('/api/admin/products/' + productId, { method: 'DELETE' });
      if (res.ok || res.status === 404) {
        router.replace('/admin/products');
        router.refresh();
        return;
      }
      if (res.status === 401) {
        router.replace('/admin/login');
        return;
      }
      setError('حذف نشد. دوباره تلاش کنید.');
    } catch {
      setError('ارتباط با سرور برقرار نشد. دوباره تلاش کنید.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className='mt-10 rounded-2xl border border-rose/30 p-4'>
      <h2 className='font-bold text-rose'>حذف محصول</h2>
      <p className='mt-1 text-sm text-ink/70'>
        محصول، سایزها و عکس‌هایش برای همیشه پاک می‌شوند. سفارش‌های قبلی همان‌طور که بودند می‌مانند. اگر فقط نمی‌خواهید مشتری‌ها آن را ببینند، «نمایش در فروشگاه» را خاموش کنید.
      </p>
      {asking ? (
        <div className='mt-3 flex gap-2'>
          <button type='button' onClick={remove} disabled={busy} className='flex-1 rounded-full bg-rose py-3 font-bold text-white disabled:opacity-50'>
            {busy ? 'در حال حذف…' : 'بله، حذف شود'}
          </button>
          <button type='button' onClick={() => setAsking(false)} disabled={busy} className='rounded-full border border-ink/20 px-5 py-3 text-sm'>
            انصراف
          </button>
        </div>
      ) : (
        <button type='button' onClick={() => setAsking(true)} className='mt-3 w-full rounded-full border border-rose/50 py-3 font-bold text-rose'>
          حذف محصول
        </button>
      )}
      <div aria-live='polite' className='mt-2 min-h-5 text-sm text-rose'>{error}</div>
    </section>
  );
}
