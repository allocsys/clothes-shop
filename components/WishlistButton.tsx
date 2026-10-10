'use client';

import { useWishlist } from '@/components/WishlistProvider';
import { IconHeart } from '@/components/Icons';

type Props = { slug: string; variant?: 'overlay' | 'inline'; className?: string };

export default function WishlistButton({ slug, variant = 'overlay', className = '' }: Props) {
  const { has, toggle, ready } = useWishlist();
  const active = ready && has(slug);
  const label = active ? 'حذف از علاقه‌مندی‌ها' : 'افزودن به علاقه‌مندی‌ها';

  if (variant === 'inline') {
    return (
      <button
        type='button'
        aria-pressed={active}
        onClick={() => toggle(slug)}
        className={'inline-flex items-center gap-2 rounded-full border border-ink/20 bg-surface px-4 py-2.5 text-sm ' + (active ? 'text-rose ' : 'text-ink ') + className}
      >
        <IconHeart width={18} height={18} fill={active ? 'currentColor' : 'none'} />
        {label}
      </button>
    );
  }

  return (
    <button
      type='button'
      aria-label={label}
      aria-pressed={active}
      onClick={() => toggle(slug)}
      className={'grid h-10 w-10 place-items-center rounded-full bg-surface/90 transition-transform active:scale-90 ' + (active ? 'text-rose ' : 'text-ink/70 ') + className}
    >
      <IconHeart width={18} height={18} fill={active ? 'currentColor' : 'none'} />
    </button>
  );
}
