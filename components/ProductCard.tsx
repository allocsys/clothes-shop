import Link from 'next/link';
import type { Product } from '@/data/products';
import GarmentArt from '@/components/GarmentArt';
import { IconHeart } from '@/components/Icons';
import { formatPrice } from '@/lib/format';

export default function ProductCard({ product }: { product: Product }) {
  const off = product.oldPrice ? Math.round((1 - product.price / product.oldPrice) * 100) : 0;
  return (
    <Link href={'/product/' + product.slug} className='group block'>
      <div className='relative aspect-[3/4] overflow-hidden rounded-2xl'>
        <GarmentArt category={product.category} seed={product.slug} />
        {off > 0 && (
          <span className='absolute right-2 top-2 rounded-full bg-rose px-2 py-0.5 text-xs font-bold text-white'>
            {new Intl.NumberFormat('fa-IR').format(off)}٪
          </span>
        )}
        <span className='absolute left-2 top-2 grid h-8 w-8 place-items-center rounded-full bg-white/90 text-ink/60'>
          <IconHeart width={18} height={18} />
        </span>
      </div>
      <h3 className='mt-2 text-sm font-medium group-hover:text-brand'>{product.title}</h3>
      <p className='mt-0.5 text-sm font-bold text-brand'>
        {formatPrice(product.price)}
        {product.oldPrice && <span className='mr-2 text-xs font-normal text-ink/40 line-through'>{formatPrice(product.oldPrice)}</span>}
      </p>
      <p className='mt-0.5 text-xs text-ink/50'>{product.sizes.join(' · ')}</p>
    </Link>
  );
}
