'use client';

import { useRef, useState } from 'react';
import GarmentArt from '@/components/GarmentArt';

type Props = { title: string; category: string; slug: string; images?: string[] };

// Shows real photos when `images` is provided; until then it shows a few
// placeholder illustrations so the layout and swipe behaviour can be tested.
export default function ProductGallery({ title, category, slug, images }: Props) {
  const hasPhotos = !!images && images.length > 0;
  const slides: string[] = hasPhotos ? images! : [slug, slug + '-b', slug + '-c'];
  const [active, setActive] = useState(0);
  const startX = useRef<number | null>(null);

  const go = (i: number) => setActive((i + slides.length) % slides.length);

  function onTouchEnd(x: number) {
    if (startX.current === null) return;
    const dx = x - startX.current;
    startX.current = null;
    if (Math.abs(dx) < 40) return;
    // Persian (RTL) layout: swipe left = next, swipe right = previous
    go(dx < 0 ? active + 1 : active - 1);
  }

  const render = (s: string, i: number) =>
    hasPhotos ? (
      // TODO: switch to next/image once real photos and image domains are configured
      // eslint-disable-next-line @next/next/no-img-element
      <img src={s} alt={title + ' - تصویر ' + (i + 1)} className='h-full w-full object-cover' loading={i === 0 ? 'eager' : 'lazy'} />
    ) : (
      <GarmentArt category={category} seed={s} />
    );

  const arrow =
    'absolute top-1/2 hidden h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-surface/80 text-ink shadow backdrop-blur md:grid';

  return (
    <div>
      <div
        className='relative aspect-[3/4] touch-pan-y select-none overflow-hidden rounded-3xl'
        onTouchStart={(e) => {
          startX.current = e.touches[0].clientX;
        }}
        onTouchEnd={(e) => onTouchEnd(e.changedTouches[0].clientX)}
      >
        {slides.map((s, i) => (
          <div
            key={s}
            className={'absolute inset-0 transition-opacity duration-300 ' + (i === active ? 'opacity-100' : 'pointer-events-none opacity-0')}
            aria-hidden={i !== active}
          >
            {render(s, i)}
          </div>
        ))}

        {slides.length > 1 && (
          <>
            <button type='button' aria-label='تصویر بعدی' onClick={() => go(active + 1)} className={arrow + ' left-3'}>
              <svg width='20' height='20' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round' aria-hidden='true'><path d='M15 6l-6 6 6 6' /></svg>
            </button>
            <button type='button' aria-label='تصویر قبلی' onClick={() => go(active - 1)} className={arrow + ' right-3'}>
              <svg width='20' height='20' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round' aria-hidden='true'><path d='M9 6l6 6-6 6' /></svg>
            </button>
            <div className='absolute inset-x-0 bottom-3 flex justify-center gap-1.5 md:hidden' aria-hidden='true'>
              {slides.map((s, i) => (
                <span key={s} className={'h-1.5 rounded-full transition-all ' + (i === active ? 'w-5 bg-brand' : 'w-1.5 bg-ink/30')} />
              ))}
            </div>
          </>
        )}
      </div>

      {slides.length > 1 && (
        <div className='mt-3 hidden gap-3 md:flex'>
          {slides.map((s, i) => (
            <button
              key={s}
              type='button'
              aria-label={'نمایش تصویر ' + (i + 1)}
              aria-current={i === active}
              onClick={() => setActive(i)}
              className={'h-24 w-[72px] overflow-hidden rounded-xl border-2 transition-colors ' + (i === active ? 'border-brand' : 'border-transparent opacity-70')}
            >
              {render(s, i)}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
