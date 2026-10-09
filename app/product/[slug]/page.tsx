import { notFound } from 'next/navigation';
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
    <article className='mt-6 grid gap-8 md:grid-cols-2'>
      <div className='aspect-[3/4] rounded-3xl bg-gradient-to-br from-brand/20 to-ink/10' />
      <div>
        <h1 className='text-2xl font-bold'>{product.title}</h1>
        <p className='mt-3 text-xl text-brand'>
          {formatPrice(product.price)}
          {product.oldPrice && <span className='mr-3 text-sm text-ink/40 line-through'>{formatPrice(product.oldPrice)}</span>}
        </p>
        <p className='mt-4 text-ink/70'>{product.description}</p>

        <h2 className='mt-6 mb-2 text-sm font-bold'>سایز</h2>
        <div className='flex gap-2'>
          {product.sizes.map((s) => (
            <span key={s} className='rounded-lg border border-ink/20 bg-white px-3 py-1 text-sm'>{s}</span>
          ))}
        </div>

        <h2 className='mt-6 mb-2 text-sm font-bold'>رنگ</h2>
        <div className='flex gap-2'>
          {product.colors.map((c) => (
            <span key={c} className='rounded-lg border border-ink/20 bg-white px-3 py-1 text-sm'>{c}</span>
          ))}
        </div>

        {/* TODO: wire up cart state (context or server actions) */}
        <button className='mt-8 w-full rounded-xl bg-brand py-3 text-white md:w-auto md:px-12'>افزودن به سبد خرید</button>
      </div>
    </article>
  );
}
