'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useCart } from '@/components/CartProvider';
import { flyToCart } from '@/lib/cartAnimation';
import { isSoldOut, stockOf, type StockMap } from '@/lib/stock';

type Props = { slug: string; category: string; sizes: string[]; colors: string[]; stock?: StockMap };

const LOW_STOCK = 3; // show "only N left" at or below this

export default function AddToCart({ slug, category, sizes, colors, stock }: Props) {
  const { add } = useCart();
  const [size, setSize] = useState(sizes.length === 1 ? sizes[0] : '');
  const [color, setColor] = useState(colors.length === 1 ? colors[0] : '');
  const [status, setStatus] = useState<'idle' | 'error' | 'added'>('idle');

  const soldOut = isSoldOut(stock);
  const has = (s: string, c: string) => stockOf(stock, s, c) > 0;
  // A size is unavailable if it is gone in the chosen color (or in every color, when no color is chosen yet).
  const sizeGone = (s: string) => (color ? !has(s, color) : colors.every((c) => !has(s, c)));
  const colorGone = (c: string) => (size ? !has(size, c) : sizes.every((s) => !has(s, c)));
  const left = size && color ? stockOf(stock, size, color) : Infinity;

  const chip = (active: boolean, gone: boolean) =>
    'rounded-full border px-4 py-1.5 text-sm transition-colors ' +
    (gone
      ? 'cursor-not-allowed border-ink/10 bg-surface text-ink/30 line-through'
      : active
        ? 'border-brand bg-brand text-white'
        : 'border-ink/20 bg-surface text-ink');

  function onAdd(button: HTMLElement) {
    if (!size || !color) {
      setStatus('error');
      return;
    }
    if (!has(size, color)) return;
    add({ slug, size, color });
    setStatus('added');
    flyToCart(button, { category, seed: slug });
  }

  return (
    <div>
      <h2 className='mb-2 mt-6 text-sm font-bold'>سایز</h2>
      <div className='flex flex-wrap gap-2'>
        {sizes.map((s) => {
          const gone = sizeGone(s);
          return (
            <button
              key={s}
              type='button'
              aria-pressed={size === s}
              disabled={gone}
              onClick={() => {
                setSize(s);
                setStatus('idle');
              }}
              className={'min-w-10 text-center ' + chip(size === s, gone)}
            >
              {s}
            </button>
          );
        })}
      </div>

      <h2 className='mb-2 mt-6 text-sm font-bold'>رنگ</h2>
      <div className='flex flex-wrap gap-2'>
        {colors.map((c) => {
          const gone = colorGone(c);
          return (
            <button
              key={c}
              type='button'
              aria-pressed={color === c}
              disabled={gone}
              onClick={() => {
                setColor(c);
                setStatus('idle');
              }}
              className={chip(color === c, gone)}
            >
              {c}
            </button>
          );
        })}
      </div>

      {soldOut ? (
        <button type='button' disabled className='mt-8 w-full cursor-not-allowed rounded-full bg-ink/15 py-3.5 font-bold text-ink/50 md:w-auto md:px-14'>
          ناموجود
        </button>
      ) : (
        <button type='button' onClick={(e) => onAdd(e.currentTarget)} className='mt-8 w-full rounded-full bg-brand py-3.5 font-bold text-white active:scale-[0.98] md:w-auto md:px-14'>
          افزودن به سبد خرید
        </button>
      )}

      <div aria-live='polite' className='mt-3 min-h-6 text-sm'>
        {status === 'error' && <p className='text-rose'>لطفاً سایز و رنگ را انتخاب کنید.</p>}
        {status !== 'error' && left <= LOW_STOCK && left > 0 && (
          <p className='text-rose'>تنها {new Intl.NumberFormat('fa-IR').format(left)} عدد باقی مانده است.</p>
        )}
        {status === 'added' && (
          <p className='text-brand'>
            به سبد خرید اضافه شد. <Link href='/cart' className='font-bold underline'>مشاهده سبد خرید</Link>
          </p>
        )}
      </div>
    </div>
  );
}
