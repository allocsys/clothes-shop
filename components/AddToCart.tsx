'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useCart } from '@/components/CartProvider';

type Props = { slug: string; sizes: string[]; colors: string[] };

export default function AddToCart({ slug, sizes, colors }: Props) {
  const { add } = useCart();
  const [size, setSize] = useState(sizes.length === 1 ? sizes[0] : '');
  const [color, setColor] = useState(colors.length === 1 ? colors[0] : '');
  const [status, setStatus] = useState<'idle' | 'error' | 'added'>('idle');

  const chip = (active: boolean) =>
    'rounded-full border px-4 py-1.5 text-sm transition-colors ' +
    (active ? 'border-brand bg-brand text-white' : 'border-ink/20 bg-surface text-ink');

  function onAdd() {
    if (!size || !color) {
      setStatus('error');
      return;
    }
    add({ slug, size, color });
    setStatus('added');
  }

  return (
    <div>
      <h2 className='mb-2 mt-6 text-sm font-bold'>سایز</h2>
      <div className='flex flex-wrap gap-2'>
        {sizes.map((s) => (
          <button
            key={s}
            type='button'
            aria-pressed={size === s}
            onClick={() => {
              setSize(s);
              setStatus('idle');
            }}
            className={'min-w-10 text-center ' + chip(size === s)}
          >
            {s}
          </button>
        ))}
      </div>

      <h2 className='mb-2 mt-6 text-sm font-bold'>رنگ</h2>
      <div className='flex flex-wrap gap-2'>
        {colors.map((c) => (
          <button
            key={c}
            type='button'
            aria-pressed={color === c}
            onClick={() => {
              setColor(c);
              setStatus('idle');
            }}
            className={chip(color === c)}
          >
            {c}
          </button>
        ))}
      </div>

      <button type='button' onClick={onAdd} className='mt-8 w-full rounded-full bg-brand py-3.5 font-bold text-white active:scale-[0.98] md:w-auto md:px-14'>
        افزودن به سبد خرید
      </button>

      <div aria-live='polite' className='mt-3 min-h-6 text-sm'>
        {status === 'error' && <p className='text-rose'>لطفاً سایز و رنگ را انتخاب کنید.</p>}
        {status === 'added' && (
          <p className='text-brand'>
            به سبد خرید اضافه شد. <Link href='/cart' className='font-bold underline'>مشاهده سبد خرید</Link>
          </p>
        )}
      </div>
    </div>
  );
}
