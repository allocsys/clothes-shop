'use client';

export default function PrintButton() {
  return (
    <button type='button' onClick={() => window.print()} className='rounded-full bg-brand px-5 py-2.5 text-sm font-bold text-white'>
      چاپ
    </button>
  );
}
