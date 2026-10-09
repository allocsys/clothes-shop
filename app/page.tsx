import Link from 'next/link';
import ProductCard from '@/components/ProductCard';
import { categories } from '@/data/categories';
import { products } from '@/data/products';
import { site } from '@/lib/site';

export default function HomePage() {
  return (
    <>
      <section className='mt-4 flex h-64 items-center justify-center rounded-3xl bg-gradient-to-l from-brand to-ink text-center text-white md:h-96'>
        <div className='px-6'>
          <h1 className='text-2xl font-bold md:text-4xl'>{site.tagline}</h1>
          <Link href='/shop' className='mt-5 inline-block rounded-lg bg-white px-6 py-2 text-brand'>مشاهده محصولات</Link>
        </div>
      </section>

      <section className='mt-10'>
        <h2 className='mb-4 text-xl font-bold'>دسته‌بندی‌ها</h2>
        <div className='grid grid-cols-2 gap-3 md:grid-cols-4'>
          {categories.map((c) => (
            <Link key={c.slug} href={'/shop?category=' + c.slug} className='rounded-2xl bg-white p-6 text-center shadow-sm hover:shadow-md'>
              {c.title}
            </Link>
          ))}
        </div>
      </section>

      <section className='mt-10'>
        <div className='mb-4 flex items-center justify-between'>
          <h2 className='text-xl font-bold'>جدیدترین‌ها</h2>
          <Link href='/shop' className='text-sm text-brand'>مشاهده همه</Link>
        </div>
        <div className='grid grid-cols-2 gap-4 md:grid-cols-4'>
          {products.slice(0, 4).map((p) => (
            <ProductCard key={p.slug} product={p} />
          ))}
        </div>
      </section>
    </>
  );
}
