import Link from 'next/link';
import NewProductForm from '@/components/admin/NewProductForm';
import { hasDb } from '@/lib/db';

export const dynamic = 'force-dynamic';

export default function NewProductPage() {
  return (
    <div>
      <Link href='/admin/products' className='text-sm text-brand'>← محصولات</Link>
      <h1 className='mt-3 text-xl font-bold'>محصول جدید</h1>
      {hasDb() ? (
        <>
          <p className='mt-1 text-xs text-ink/60'>بعد از ساخت محصول، به صفحهٔ ویرایش می‌روید تا عکس اضافه کنید.</p>
          <NewProductForm />
        </>
      ) : (
        <p className='mt-4 rounded-2xl bg-surface p-4 text-sm text-ink/70'>ساخت محصول به دیتابیس نیاز دارد (DATABASE_URL).</p>
      )}
    </div>
  );
}
