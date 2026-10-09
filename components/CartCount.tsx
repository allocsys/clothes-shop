'use client';

import { useCart } from '@/components/CartProvider';

// Live item-count badge on the header cart icon
export default function CartCount() {
  const { count } = useCart();
  return (
    <span className='absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-brand px-1 text-[10px] text-white'>
      {new Intl.NumberFormat('fa-IR').format(count)}
    </span>
  );
}
