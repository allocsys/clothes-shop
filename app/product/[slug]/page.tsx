import Link from 'next/link';
import { notFound } from 'next/navigation';
import AddToCart from '@/components/AddToCart';
import ProductCard from '@/components/ProductCard';
import ProductGallery from '@/components/ProductGallery';
import SectionHeading from '@/components/SectionHeading';
import WishlistButton from '@/components/WishlistButton';
import { formatPrice } from '@/lib/format';
import { getProduct, getProducts } from '@/lib/products';
import type { Metadata } from 'next';
import { site } from '@/lib/site';
import { mediaUrl } from '@/lib/media';
import { absoluteUrl } from '@/lib/siteUrl';
import { isSoldOut } from '@/lib/stock';

export const dynamic = 'force-dynamic';

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) return { title: site.name };
  const description = (product.description || site.tagline).trim().slice(0, 160);
  const image = product.images?.[0] ? absoluteUrl(mediaUrl(product.images[0])) : undefined;
  return {
    title: product.title,
    description,
    alternates: { canonical: absoluteUrl('/product/' + product.slug) },
    openGraph: {
      title: product.title,
      description,
      url: absoluteUrl('/product/' + product.slug),
      siteName: site.name,
      locale: 'fa_IR',
      type: 'website',
      ...(image ? { images: [{ url: image }] } : {}),
    },
  };
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) notFound();
  const products = await getProducts();

  // Structured data for search engines. Prices are stored in Toman; schema.org wants IRR (1 Toman = 10 Rial).
  const ldImages = (product.images ?? []).map((k) => absoluteUrl(mediaUrl(k)));
  const jsonLd = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.title,
    description: product.description || site.tagline,
    sku: product.slug,
    ...(ldImages.length ? { image: ldImages } : {}),
    offers: {
      '@type': 'Offer',
      url: absoluteUrl('/product/' + product.slug),
      priceCurrency: 'IRR',
      price: String(product.price * 10),
      availability: isSoldOut(product.stock) ? 'https://schema.org/OutOfStock' : 'https://schema.org/InStock',
    },
  }).replace(/</g, String.fromCharCode(92) + 'u003c');

  // Related: same category first, then fill up with other products
  const others = products.filter((p) => p.slug !== product.slug);
  const related = [...others.filter((p) => p.category === product.category), ...others.filter((p) => p.category !== product.category)].slice(0, 4);

  return (
    <article className='mt-6'>
      <script type='application/ld+json' dangerouslySetInnerHTML={{ __html: jsonLd }} />
      <nav className='mb-4 text-xs text-ink/70'>
        <Link href='/' className='inline-block py-2.5'>خانه</Link> / <Link href='/shop' className='inline-block py-2.5'>فروشگاه</Link> / {product.title}
      </nav>
      <div className='grid gap-8 md:grid-cols-2'>
        <ProductGallery title={product.title} category={product.category} slug={product.slug} images={product.images} />
        <div>
          <h1 className='text-2xl font-bold'>{product.title}</h1>
          <p className='mt-3 text-xl font-bold text-brand'>
            {formatPrice(product.price)}
            {product.oldPrice && <span className='mr-3 text-sm font-normal text-ink/70 line-through'>{formatPrice(product.oldPrice)}</span>}
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
