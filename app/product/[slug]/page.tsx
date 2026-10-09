import Link from 'next/link';
import { notFound } from 'next/navigation';
import AddToCart from '@/components/AddToCart';
import ProductCard from '@/components/ProductCard';
import ProductGallery from '@/components/ProductGallery';
import SectionHeading from '@/components/SectionHeading';
import WishlistButton from '@/components/WishlistButton';
import { formatPrice } from '@/lib/format';
import { getProduct, getProducts } from '@/lib/products';

export const dynamic = 'force-dynamic';

type Props = { params: Promise<{ slug: string }> };

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) notFound();
  const products = await getProducts();

  // Related: same category first, then fill up with other products
  const others = products.filter((p) => p.slug !== product.slug);
  const related = [...others.filter((p) => p.category === product.category), ...others.filter((p) => p.category !== product.category)].slice(0, 4);

  return (
    <article className='mt-6'>
      <nav className='mb-4 text-xs text-ink/50'>
        <Link href='/'>خانه</Link> / <Link href='/shop'>فروشگاه</Link> / {product.title}
      </nav>
      <div className='grid gap-8 md:grid-cols-2'>
        <ProductGallery title={product.title} category={product.category} slug={product.slug} images={product.images} />
        <div>
          <h1 className='text-2xl font-bold'>{product.title}</h1>
          <p className='mt-3 text-xl font-bold text-brand'>
            {formatPrice(product.price)}
            {product.oldPrice && <span className='mr-3 text-sm font-normal text-ink/40 line-through'>{formatPrice(product.oldPrice)}</span>}
          </p>
          <p className='mt-4 leading-8 text-ink/70'>{product.description}</p>

          <AddToCart slug={product.slug} category={product.category} sizes={product.sizes} colors={product.colors} stock={product.stock} />
          <WishlistButton slug={product.slug} variant='inline' className='mt-3' />
        </div>
      </div>

      {related.length > 0 && (
        <section className='mt-14'>
          <SectionHeading title='محصولات مشابه' href={'/shop?category=' + product.category} />
          <div className='grid grid-cols-2 gap-4 md:grid-cols-4'>
            {related.map((p) => (
              <ProductCard key={p.slug} product={p} />
            ))}
          </div>
        </section>
      )}
    </article>
  );
}
