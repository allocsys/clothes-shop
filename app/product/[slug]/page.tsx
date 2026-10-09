import Link from 'next/link';
import { notFound } from 'next/navigation';
import GarmentArt from '@/components/GarmentArt';
import { products } from '@/data/products';
import { formatPrice } from '@/lib/format';

export function generateStaticParams() {
  return products.map((p) => ({ slug: p.slug }));
}

type Props = { params: Promise<{ slug: string }> };

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const product = products.find((p) => p.slug === slug);
  if (!product) notFound();

  return (
    <article className='mt-6'>
      <nav className='mb-4 text-xs text-ink/50'>
        <Link href='/'>خانه</Link> / <Link href='/shop'>فروشگاه</Link> / {product.title}
      </nav>
      <div className='grid gap-8 md:grid-cols-2'>
        <div className='aspect-[3/4] overflow-hidden rounded-3xl'>
          <GarmentArt category={product.category} seed={product.slug} />
        </div>
        <div>
          <h1 className='text-2xl font-bold'>{product.title}</h1>
          <p className='mt-3 text-xl font-bold text-brand'>
            {formatPrice(product.price)}
            {product.oldPrice && <span className='mr-3 text-sm font-normal text-ink/40 line-through'>{formatPrice(product.oldPrice)}</span>}
          </p>
          <p className='mt-4 leading-8 text-ink/70'>{product.description}</p>

          <h2 className='mb-2 mt-6 text-sm font-bold'>سایز</h2>
          <div className='flex flex-wrap gap-2'>
            {product.sizes.map((s) => (
              <span key={s} className='min-w-10 rounded-full border border-ink/20 bg-surface px-4 py-1.5 text-center text-sm'>{s}</span>
            ))}
          </div>

          <h2 className='mb-2 mt-6 text-sm font-bold'>رنگ</h2>
          <div className='flex flex-wrap gap-2'>
            {product.colors.map((c) => (
              <span key={c} className='rounded-full border border-ink/20 bg-surface px-4 py-1.5 text-sm'>{c}</span>
            ))}
          </div>

          {/* TODO: wire up cart state (context or server actions) */}
          <button className='mt-8 w-full rounded-full bg-brand py-3.5 font-bold text-white md:w-auto md:px-14'>افزودن به سبد خرید</button>
        </div>
      </div>
    </article>
  );
}
