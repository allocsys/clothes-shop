import Link from 'next/link';
import type { Product } from '@/data/products';
import ProductImage from '@/components/ProductImage';
import WishlistButton from '@/components/WishlistButton';
import { formatPrice } from '@/lib/format';
import { isSoldOut } from '@/lib/stock';

export default function ProductCard({ product }: { product: Product }) {
  const soldOut = isSoldOut(product.stock);
  const off = product.oldPrice ? Math.round((1 - product.price / product.oldPrice) * 100) : 0;
  return (
    <div className='group relative'>
      <Link href={'/product/' + product.slug} className='block'>
        <div className='relative aspect-[3/4] overflow-hidden rounded-2xl'>
          <ProductImage
            image={product.images?.[0]}
            category={product.category}
            seed={product.slug}
            alt={product.title}
            sizes='(min-width: 768px) 25vw, 50vw'
          />
          {soldOut && (
            <span className='absolute inset-x-0 bottom-0 bg-ink/70 py-1.5 text-center text-xs font-bold text-white'>ناموجود</span>
          )}
          {off > 0 && !soldOut && (
            <span className='absolute right-2 top-2 rounded-full bg-rose px-2 py-0.5 text-xs font-bold text-white'>
              {new Intl.NumberFormat('fa-IR').format(off)}٪
            </span>
          )}
        </div>
        <h3 className='mt-2 text-sm font-medium group-hover:text-brand'>{product.title}</h3>
        <p className='mt-0.5 text-sm font-bold text-brand'>
          {formatPrice(product.price)}
          {product.oldPrice && <span className='mr-2 text-xs font-normal text-ink/40 line-through'>{formatPrice(product.oldPrice)}</span>}
        </p>
        <p className='mt-0.5 text-xs text-ink/50'>{product.sizes.join(' · ')}</p>
      </Link>
      {/* Heart sits outside the link so tapping it never navigates */}
      <WishlistButton slug={product.slug} className='absolute left-2 top-2' />
    </div>
  );
}
