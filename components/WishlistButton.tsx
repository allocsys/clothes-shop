'use client';

import { useEffect, useRef, useState } from 'react';
import { useWishlist } from '@/components/WishlistProvider';
import { IconHeart } from '@/components/Icons';

type Props = { slug: string; variant?: 'overlay' | 'inline'; className?: string };

export default function WishlistButton({ slug, variant = 'overlay', className = '' }: Props) {
  const { has, toggle, ready } = useWishlist();
  const active = ready && has(slug);
  const label = active ? 'حذف از علاقه‌مندی‌ها' : 'افزودن به علاقه‌مندی‌ها';

  // Short "pop" on the heart, only when the customer taps to ADD (not on page load, not on remove).
  const [pop, setPop] = useState(false);
  const timer = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearTimeout(timer.current), []);

  function onClick() {
    if (!active) {
      setPop(false);
      window.clearTimeout(timer.current);
      // Next frame, so tapping again restarts the animation
      timer.current = window.setTimeout(() => {
        setPop(true);
        timer.current = window.setTimeout(() => setPop(false), 450);
      }, 20);
    }
    toggle(slug);
  }

  const heart = (
    <span className={'inline-flex ' + (pop ? 'heart-pop' : '')}>
      <IconHeart width={18} height={18} fill={active ? 'currentColor' : 'none'} />
    </span>
  );

  if (variant === 'inline') {
    return (
      <button
        type='button'
        aria-pressed={active}
        onClick={onClick}
        className={'inline-flex items-center gap-2 rounded-full border border-ink/20 bg-surface px-4 py-2.5 text-sm ' + (active ? 'text-rose ' : 'text-ink ') + className}
      >
        {heart}
        {label}
      </button>
    );
  }

  return (
    <button
      type='button'
      aria-label={label}
      aria-pressed={active}
      onClick={onClick}
      className={'grid h-10 w-10 place-items-center rounded-full bg-surface/90 transition-transform active:scale-90 ' + (active ? 'text-rose ' : 'text-ink/70 ') + className}
    >
      {heart}
    </button>
  );
}
