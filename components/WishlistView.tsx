'use client';

import Link from 'next/link';
import ProductCard from '@/components/ProductCard';
import EmptyState from '@/components/EmptyState';
import { IconHeart } from '@/components/Icons';
import { useWishlist } from '@/components/WishlistProvider';
import { useProducts } from '@/components/useProducts';

export default function WishlistView() {
  const { slugs, ready } = useWishlist();
  const { products, loading } = useProducts(slugs);
  if (!ready || loading) return <p className='py-20 text-center text-ink/70'>در حال بارگذاری...</p>;

  const list = slugs.flatMap((s) => {
    const p = products.find((x) => x.slug === s);
    return p ? [p] : [];
  });

  if (list.length === 0) {
    return (
      <section>
        <EmptyState
          as='h1'
          icon={<IconHeart width={36} height={36} />}
          title='هنوز محصولی به علاقه‌مندی‌ها اضافه نکرده‌اید.'
          hint='روی قلب هر محصول بزنید تا اینجا ذخیره شود.'
          href='/shop'
          action='مشاهده محصولات'
        />
      </section>
    );
  }

  return (
    <section className='mt-6'>
      <h1 className='mb-4 flex items-center gap-2 text-xl font-bold'>
        <span aria-hidden='true' className='h-5 w-1.5 rounded-full bg-gold' />
        <span>
          علاقه‌مندی‌ها <span className='text-sm font-normal text-ink/70'>({new Intl.NumberFormat('fa-IR').format(list.length)} کالا)</span>
        </span>
      </h1>
      <div className='grid grid-cols-2 gap-4 md:grid-cols-4'>
        {list.map((p) => (
          <ProductCard key={p.slug} product={p} headingLevel={2} />
        ))}
      </div>
    </section>
  );
}
