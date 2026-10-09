'use client';

import { IconArrowUp } from '@/components/Icons';

// Round back-to-top button for the footer
export default function ScrollTop() {
  return (
    <button
      type='button'
      aria-label='بازگشت به بالای صفحه'
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      className='grid h-11 w-11 place-items-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20'
    >
      <IconArrowUp width={20} height={20} />
    </button>
  );
}
