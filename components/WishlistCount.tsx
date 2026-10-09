'use client';

import { useWishlist } from '@/components/WishlistProvider';

// Count badge on the header heart icon (hidden while the list is empty)
export default function WishlistCount() {
  const { count } = useWishlist();
  if (count === 0) return null;
  return (
    <span className='absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-rose px-1 text-[10px] text-white'>
      {new Intl.NumberFormat('fa-IR').format(count)}
    </span>
  );
}
