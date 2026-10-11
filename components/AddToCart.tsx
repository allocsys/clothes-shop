'use client';

import { useState } from 'react';
import Link from 'next/link';
import { MAX_QTY, useCart } from '@/components/CartProvider';
import { flyToCart } from '@/lib/cartAnimation';
import { isSoldOut, stockOf, type StockMap } from '@/lib/stock';

type Props = { slug: string; category: string; sizes: string[]; colors: string[]; stock?: StockMap; image?: string };

const LOW_STOCK = 3; // show "only N left" at or below this

export default function AddToCart({ slug, category, sizes, colors, stock, image }: Props) {
  const { add, lines } = useCart();
  const [size, setSize] = useState(sizes.length === 1 ? sizes[0] : '');
  const [color, setColor] = useState(colors.length === 1 ? colors[0] : '');
  const [status, setStatus] = useState<'idle' | 'error' | 'added' | 'max'>('idle');
  // Tapping something unavailable gives one small shake (disabled buttons never fire clicks, so these use aria-disabled).
  const [shakeChip, setShakeChip] = useState('');
  const [shakeSold, setShakeSold] = useState(false);

  const soldOut = isSoldOut(stock);
  const has = (s: string, c: string) => stockOf(stock, s, c) > 0;
  // A size is unavailable if it is gone in the chosen color (or in every color, when no color is chosen yet).
  const sizeGone = (s: string) => (color ? !has(s, color) : colors.every((c) => !has(s, c)));
  const colorGone = (c: string) => (size ? !has(size, c) : sizes.every((s) => !has(s, c)));
  const left = size && color ? stockOf(stock, size, color) : Infinity;
  // What this size + color already has in the cart, and the most the cart may hold of it (stock or the per-item limit).
  const inCart = size && color ? (lines.find((l) => l.slug === slug && l.size === size && l.color === color)?.qty ?? 0) : 0;
  const cap = Math.min(MAX_QTY, left);

  const chip = (active: boolean, gone: boolean) =>
    'min-h-10 rounded-full border px-4 py-1.5 text-sm transition-colors ' +
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
    if (inCart >= cap) {
      setStatus('max');
      return;
    }
    add({ slug, size, color });
    setStatus('added');
    flyToCart(button, { category, seed: slug, image });
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
              aria-disabled={gone || undefined}
              onClick={() => {
                if (gone) {
                  setShakeChip('s:' + s);
                  return;
                }
                setSize(s);
                setStatus('idle');
              }}
              onAnimationEnd={() => setShakeChip('')}
              className={'min-w-10 text-center ' + chip(size === s, gone) + (shakeChip === 's:' + s ? ' soft-shake' : '')}
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
              aria-disabled={gone || undefined}
              onClick={() => {
                if (gone) {
                  setShakeChip('c:' + c);
                  return;
                }
                setColor(c);
                setStatus('idle');
              }}
              onAnimationEnd={() => setShakeChip('')}
              className={chip(color === c, gone) + (shakeChip === 'c:' + c ? ' soft-shake' : '')}
            >
              {c}
            </button>
          );
        })}
      </div>

      {soldOut ? (
        <div className='mt-8'>
          <button
            type='button'
            aria-disabled='true'
            onClick={() => setShakeSold(true)}
            onAnimationEnd={() => setShakeSold(false)}
            className={'inline-flex w-full cursor-not-allowed items-center justify-center gap-2 rounded-full bg-ink/15 py-3.5 font-bold text-ink/70 md:w-auto md:px-14' + (shakeSold ? ' soft-shake' : '')}
          >
            <span aria-hidden='true' className='moon-sway'>
              <svg width='18' height='18' viewBox='0 0 24 24' fill='currentColor' stroke='currentColor' strokeWidth='1.5' strokeLinejoin='round'>
                <path d='M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z' />
              </svg>
            </span>
            ناموجود
          </button>
          <p className='mt-3 text-sm text-ink/70'>فعلاً تموم شده 🌙</p>
        </div>
      ) : (
        <button type='button' onClick={(e) => onAdd(e.currentTarget)} className='mt-8 w-full rounded-full bg-brand py-3.5 font-bold text-white active:scale-[0.98] md:w-auto md:px-14'>
          افزودن به سبد خرید
        </button>
      )}

      <div aria-live='polite' className='mt-3 min-h-6 text-sm'>
        {status === 'error' && <p className='text-rose'>لطفاً سایز و رنگ را انتخاب کنید.</p>}
        {status === 'max' && (
          <p className='text-rose'>
            {left < MAX_QTY
              ? 'همهٔ موجودی این مورد (' + new Intl.NumberFormat('fa-IR').format(left) + ' عدد) در سبد شماست.'
              : 'حداکثر ' + new Intl.NumberFormat('fa-IR').format(MAX_QTY) + ' عدد از هر مورد می‌توانید سفارش دهید.'}{' '}
            <Link href='/cart' className='font-bold underline'>مشاهده سبد خرید</Link>
          </p>
        )}
        {status !== 'error' && status !== 'max' && left <= LOW_STOCK && left > 0 && (
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
