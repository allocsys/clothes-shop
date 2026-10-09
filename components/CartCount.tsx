'use client';

import { useCart } from '@/components/CartProvider';

// Live item-count badge on the header cart icon (hidden while the cart is empty)
export default function CartCount() {
  const { count } = useCart();
  if (count === 0) return null;
  return (
    <span className='absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-brand px-1 text-[11px] font-bold leading-none text-night'>
      {new Intl.NumberFormat('fa-IR').format(count)}
    </span>
  );
}
