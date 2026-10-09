'use client';

import { useEffect, useRef, useState } from 'react';
import { CART_LANDED } from '@/lib/cartAnimation';

// Replaces the old permanent count dot on the header cart icon.
// When the flying circle lands (see lib/cartAnimation.ts) the cart icon bounces
// and a small "+۱" pops up and fades away. Renders nothing the rest of the time.
export default function CartFeedback() {
  const ref = useRef<HTMLSpanElement>(null);
  const [pop, setPop] = useState(0); // changes on every landing so the badge restarts its animation

  useEffect(() => {
    const onLanded = () => {
      setPop((n) => n + 1);
      const icon = ref.current?.parentElement;
      if (icon && typeof icon.animate === 'function') {
        icon.animate(
          [
            { transform: 'scale(1) rotate(0deg)' },
            { transform: 'scale(1.3) rotate(-10deg)', offset: 0.3 },
            { transform: 'scale(0.92) rotate(6deg)', offset: 0.6 },
            { transform: 'scale(1) rotate(0deg)' },
          ],
          { duration: 480, easing: 'ease-out' },
        );
      }
    };
    window.addEventListener(CART_LANDED, onLanded);
    return () => window.removeEventListener(CART_LANDED, onLanded);
  }, []);

  // Remove the badge once its animation is over
  useEffect(() => {
    if (!pop) return;
    const t = window.setTimeout(() => setPop(0), 1300);
    return () => window.clearTimeout(t);
  }, [pop]);

  return (
    <span ref={ref} className='pointer-events-none absolute inset-0' aria-hidden='true'>
      {pop > 0 && (
        <span
          key={pop}
          dir='ltr'
          className='cart-pop absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-brand px-1 text-[11px] font-bold leading-none text-white'
        >
          +۱
        </span>
      )}
    </span>
  );
}
