'use client';

import Link from 'next/link';
import ProductCard from '@/components/ProductCard';
import { useWishlist } from '@/components/WishlistProvider';
import { useProducts } from '@/components/useProducts';

export default function WishlistView() {
  const { slugs, ready } = useWishlist();
  const { products, loading } = useProducts(slugs);
  if (!ready || loading) return <p className='py-20 text-center text-ink/50'>در حال بارگذاری...</p>;

  const list = slugs.flatMap((s) => {
    const p = products.find((x) => x.slug === s);
    return p ? [p] : [];
  });

  if (list.length === 0) {
    return (
      <section className='py-20 text-center'>
        <p className='text-ink/60'>هنوز محصولی به علاقه‌مندی‌ها اضافه نکرده‌اید.</p>
        <p className='mt-1 text-xs text-ink/40'>روی قلب هر محصول بزنید تا اینجا ذخیره شود.</p>
        <Link href='/shop' className='mt-5 inline-block rounded-full bg-brand px-8 py-3 font-bold text-white'>مشاهده محصولات</Link>
      </section>
    );
  }

  return (
    <section className='mt-6'>
      <h1 className='mb-4 text-xl font-bold'>
        علاقه‌مندی‌ها <span className='text-sm font-normal text-ink/50'>({new Intl.NumberFormat('fa-IR').format(list.length)} کالا)</span>
      </h1>
      <div className='grid grid-cols-2 gap-4 md:grid-cols-4'>
        {list.map((p) => (
          <ProductCard key={p.slug} product={p} />
        ))}
      </div>
    </section>
  );
}
