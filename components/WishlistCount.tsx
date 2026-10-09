'use client';

import { useWishlist } from '@/components/WishlistProvider';

// Count badge on the header heart icon (hidden while the list is empty)
export default function WishlistCount() {
  const { count } = useWishlist();
  if (count === 0) return null;
  return (
    <span className='absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-rose px-1 text-[11px] font-bold leading-none text-white'>
      {new Intl.NumberFormat('fa-IR').format(count)}
    </span>
  );
}
