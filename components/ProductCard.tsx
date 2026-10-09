import Link from 'next/link';
import type { Product } from '@/data/products';
import { formatPrice } from '@/lib/format';

export default function ProductCard({ product }: { product: Product }) {
  return (
    <Link href={'/product/' + product.slug} className='group block'>
      {/* Placeholder image block. Swap for next/image when real photos exist. */}
      <div className='relative aspect-[3/4] overflow-hidden rounded-2xl bg-gradient-to-br from-brand/20 to-ink/10'>
        {product.oldPrice && (
          <span className='absolute right-2 top-2 rounded-full bg-brand px-2 py-0.5 text-xs text-white'>تخفیف</span>
        )}
      </div>
      <h3 className='mt-2 text-sm group-hover:text-brand'>{product.title}</h3>
      <p className='text-sm text-brand'>
        {formatPrice(product.price)}
        {product.oldPrice && <span className='mr-2 text-xs text-ink/40 line-through'>{formatPrice(product.oldPrice)}</span>}
      </p>
    </Link>
  );
}
