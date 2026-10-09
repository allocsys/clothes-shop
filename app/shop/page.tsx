import ProductCard from '@/components/ProductCard';
import { products } from '@/data/products';

export const metadata = { title: 'فروشگاه' };

type Props = { searchParams: Promise<{ category?: string; q?: string; sort?: string }> };

export default async function ShopPage({ searchParams }: Props) {
  const { category, q, sort } = await searchParams;

  let list = products.filter((p) => !category || p.category === category);
  if (q) list = list.filter((p) => p.title.includes(q));
  if (sort === 'price-asc') list = [...list].sort((a, b) => a.price - b.price);
  if (sort === 'price-desc') list = [...list].sort((a, b) => b.price - a.price);

  return (
    <section className='mt-6'>
      <div className='mb-4 flex items-center justify-between'>
        <h1 className='text-xl font-bold'>محصولات</h1>
        <form className='text-sm'>
          {category && <input type='hidden' name='category' value={category} />}
          <select name='sort' defaultValue={sort ?? ''} className='rounded-lg border border-ink/20 bg-white px-2 py-1'>
            <option value=''>مرتب‌سازی</option>
            <option value='price-asc'>ارزان‌ترین</option>
            <option value='price-desc'>گران‌ترین</option>
          </select>
          <button className='mr-2 rounded-lg bg-brand px-3 py-1 text-white'>اعمال</button>
        </form>
      </div>
      {list.length === 0 ? (
        <p className='py-20 text-center text-ink/60'>محصولی پیدا نشد.</p>
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
