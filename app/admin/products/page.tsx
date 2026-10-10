import Link from 'next/link';
import ProductImage from '@/components/ProductImage';
import { categoryTitle } from '@/data/categories';
import { listAdminProducts } from '@/lib/adminProducts';
import { hasDb } from '@/lib/db';
import { formatPrice } from '@/lib/format';

export const dynamic = 'force-dynamic';

export default async function AdminProductsPage() {
  const fa = (n: number) => new Intl.NumberFormat('fa-IR').format(n);

  if (!hasDb()) {
    return (
      <div>
        <Link href='/admin' className='text-sm text-brand'>← پنل مدیریت</Link>
        <h1 className='mt-3 text-xl font-bold'>محصولات</h1>
        <p className='mt-4 rounded-2xl bg-surface p-4 text-sm text-ink/70'>
          مدیریت محصولات به دیتابیس نیاز دارد، ولی این سرور به دیتابیس وصل نیست (DATABASE_URL).
        </p>
      </div>
    );
  }

  const products = await listAdminProducts();
  const hidden = products.filter((p) => !p.isActive).length;

  return (
    <div>
      <Link href='/admin' className='text-sm text-brand'>← پنل مدیریت</Link>
      <div className='mt-3 flex items-center justify-between gap-3'>
        <h1 className='text-xl font-bold'>محصولات</h1>
        <Link href='/admin/products/new' className='rounded-full bg-brand px-4 py-2 text-sm font-bold text-white'>+ محصول جدید</Link>
      </div>
      <p className='mt-1 text-sm text-ink/60'>
        {fa(products.length)} محصول{hidden > 0 ? ` (${fa(hidden)} مخفی)` : ''}
      </p>

      {products.length === 0 && <p className='mt-6 rounded-2xl bg-surface p-4 text-sm text-ink/70'>هنوز محصولی ثبت نشده است.</p>}

      <ul className='mt-4 space-y-3'>
        {products.map((p) => (
          <li key={p.id} className={'flex gap-3 rounded-2xl bg-surface p-3' + (p.isActive ? '' : ' opacity-70')}>
            <div className='relative h-[72px] w-14 shrink-0 overflow-hidden rounded-xl'>
              <ProductImage image={p.image ?? undefined} category={p.category} seed={p.slug} alt={p.title} sizes='56px' />
            </div>
            <div className='min-w-0 flex-1'>
              <div className='flex items-start justify-between gap-2'>
                <p className='truncate font-bold'>{p.title}</p>
                {!p.isActive && <span className='shrink-0 rounded-full bg-ink/10 px-2 py-0.5 text-xs'>مخفی</span>}
              </div>
              <p className='mt-0.5 text-xs text-ink/60'>{categoryTitle(p.category)}</p>
              <p className='mt-1 text-sm'>
                <span className='font-bold text-brand'>{formatPrice(p.price)}</span>
                {p.oldPrice != null && <span className='ms-2 text-xs text-ink/50 line-through'>{formatPrice(p.oldPrice)}</span>}
              </p>
              <p className='mt-1 text-xs'>
                {p.totalStock > 0 ? (
                  <span className='text-ink/60'>
                    موجودی: {fa(p.totalStock)} عدد · {fa(p.variantCount)} سایز/رنگ
                  </span>
                ) : (
                  <span className='font-bold text-rose'>ناموجود</span>
                )}
              </p>
              <div className='mt-2 flex gap-4 text-xs'>
                <Link href={'/admin/products/' + p.id} className='font-bold text-brand'>
                  ویرایش
                </Link>
                {p.isActive && (
                  <Link href={'/product/' + p.slug} target='_blank' className='text-brand'>
                    مشاهده در فروشگاه
                  </Link>
                )}
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
