import Link from 'next/link';
import ProductCard from '@/components/ProductCard';
import { categories, categorySlugs } from '@/data/categories';
import { products } from '@/data/products';

export const metadata = { title: 'فروشگاه' };

type Props = { searchParams: Promise<{ category?: string; q?: string; sort?: string }> };

const chips = [
  { slug: '', title: 'همه' },
  ...categories.flatMap((c) => [c, ...(c.children ?? [])]).map((c) => ({ slug: c.slug, title: c.title })),
];

export default async function ShopPage({ searchParams }: Props) {
  const { category, q, sort } = await searchParams;

  let list = category ? products.filter((p) => categorySlugs(category).includes(p.category)) : products;
  if (q) list = list.filter((p) => p.title.includes(q));
  if (sort === 'price-asc') list = [...list].sort((a, b) => a.price - b.price);
  if (sort === 'price-desc') list = [...list].sort((a, b) => b.price - a.price);

  return (
    <section className='mt-6'>
      <div className='no-scrollbar mb-5 flex gap-2 overflow-x-auto pb-1'>
        {chips.map((c) => {
          const active = (category ?? '') === c.slug;
          return (
            <Link
              key={c.slug || 'all'}
              href={c.slug ? '/shop?category=' + c.slug : '/shop'}
              className={'shrink-0 rounded-full border px-4 py-1.5 text-sm ' + (active ? 'border-brand bg-brand text-white' : 'border-ink/15 bg-white')}
            >
              {c.title}
            </Link>
          );
        })}
      </div>

      <div className='mb-4 flex items-center justify-between'>
        <h1 className='text-xl font-bold'>محصولات <span className='text-sm font-normal text-ink/50'>({new Intl.NumberFormat('fa-IR').format(list.length)} کالا)</span></h1>
        <form className='flex items-center gap-2 text-sm'>
          {category && <input type='hidden' name='category' value={category} />}
          <select name='sort' defaultValue={sort ?? ''} className='rounded-lg border border-ink/15 bg-white px-2 py-1.5'>
            <option value=''>مرتب‌سازی</option>
            <option value='price-asc'>ارزان‌ترین</option>
            <option value='price-desc'>گران‌ترین</option>
          </select>
          <button className='rounded-lg bg-brand px-3 py-1.5 text-white'>اعمال</button>
        </form>
      </div>

      {list.length === 0 ? (
        <p className='py-20 text-center text-ink/60'>محصولی پیدا نشد. فیلتر یا عبارت جستجو را تغییر دهید.</p>
      ) : (
        <div className='grid grid-cols-2 gap-4 md:grid-cols-4'>
          {list.map((p) => (
            <ProductCard key={p.slug} product={p} />
          ))}
        </div>
      )}
    </section>
  );
}
