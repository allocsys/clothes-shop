'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { IconMenu, IconSearch, IconUser } from '@/components/Icons';

type Category = { slug: string; title: string; children?: { slug: string; title: string }[] };

// TODO: edit to match your real pages
const usefulLinks: [string, string][] = [
  ['صفحه اصلی', '/'],
  ['فروشگاه', '/shop'],
  ['درباره ما', '/pages/about-us'],
  ['تماس با ما', '/pages/contact-us'],
  ['سوالات متداول', '/pages/faq'],
  ['رویه بازگشت کالا', '/pages/return-policy'],
  ['قوانین و مقررات', '/pages/terms-and-conditions'],
];

function Chevron({ open }: { open: boolean }) {
  return (
    <svg
      width='18'
      height='18'
      viewBox='0 0 24 24'
      fill='none'
      stroke='currentColor'
      strokeWidth='2'
      strokeLinecap='round'
      strokeLinejoin='round'
      className={'transition-transform duration-200 ' + (open ? 'rotate-180' : '')}
      aria-hidden='true'
    >
      <path d='M6 9l6 6 6-6' />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width='20' height='20' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2.4' strokeLinecap='round' aria-hidden='true'>
      <path d='M6 6l12 12M18 6L6 18' />
    </svg>
  );
}

export default function MobileMenu({ categories, name }: { categories: Category[]; name: string }) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [tab, setTab] = useState<'cats' | 'links'>('cats');
  const [expanded, setExpanded] = useState<string | null>(null);
  const pathname = usePathname();
  const close = () => setOpen(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const tabClass = (active: boolean) =>
    'rounded-xl py-3 text-sm font-bold transition-colors ' + (active ? 'border border-brand/40 bg-brand/15 text-brand' : 'border border-ink/15 bg-transparent text-ink/70');

  const drawer = (
    <div className={'fixed inset-0 z-[80] md:hidden ' + (open ? '' : 'pointer-events-none')} aria-hidden={!open}>
      <div
        onClick={close}
        className={'absolute inset-0 bg-black/55 backdrop-blur-sm transition-opacity duration-300 ' + (open ? 'opacity-100' : 'opacity-0')}
      />
      <aside
        role='dialog'
        aria-modal='true'
        aria-label='منو'
        dir='rtl'
        className={
          'absolute inset-y-0 right-0 flex w-[88%] max-w-sm flex-col bg-sand text-ink shadow-2xl transition-transform duration-300 ease-out ' +
          (open ? 'translate-x-0' : 'translate-x-full')
        }
      >
        <div className='flex items-center justify-between px-5 pb-1 pt-5'>
          <span className='font-display text-3xl text-brand'>{name}</span>
          <button type='button' onClick={close} aria-label='بستن منو' className='grid h-11 w-11 place-items-center rounded-xl bg-brand text-white'>
            <CloseIcon />
          </button>
        </div>

        <form action='/shop' onSubmit={close} className='relative mx-5 mt-4'>
          <input
            name='q'
            type='search'
            placeholder='جستجو در میان محصولات...'
            className='w-full rounded-xl border border-ink/15 bg-surface py-3 pl-4 pr-11 text-sm text-ink outline-none focus:border-brand'
          />
          <button type='submit' aria-label='جستجو' className='absolute right-3 top-1/2 -translate-y-1/2 text-ink/50'>
            <IconSearch width={20} height={20} />
          </button>
        </form>

        <div className='mx-5 mt-4 grid grid-cols-2 gap-3'>
          <button type='button' onClick={() => setTab('cats')} className={tabClass(tab === 'cats')}>دسته‌بندی‌ها</button>
          <button type='button' onClick={() => setTab('links')} className={tabClass(tab === 'links')}>لینک‌های مفید</button>
        </div>

        <div className='mt-2 flex-1 overflow-y-auto px-5'>
          {tab === 'cats' ? (
            <ul className='divide-y divide-ink/10'>
              <li>
                <Link href='/shop' onClick={close} className='block py-4 text-[15px] font-bold text-brand'>همه محصولات</Link>
              </li>
              {categories.map((c) => {
                const isOpen = expanded === c.slug;
                return (
                  <li key={c.slug}>
                    <div className='flex items-center'>
                      <Link href={'/shop?category=' + c.slug} onClick={close} className='flex-1 py-4 text-[15px]'>{c.title}</Link>
                      {c.children && (
                        <button
                          type='button'
                          aria-label={'زیرمجموعه ' + c.title}
                          aria-expanded={isOpen}
                          onClick={() => setExpanded(isOpen ? null : c.slug)}
                          className='grid h-9 w-9 place-items-center rounded-full text-ink/60'
                        >
                          <Chevron open={isOpen} />
                        </button>
                      )}
                    </div>
                    {c.children && isOpen && (
                      <ul className='mb-3 mr-1 space-y-1 border-r-2 border-brand/30 pr-3 text-sm'>
                        {c.children.map((x) => (
                          <li key={x.slug}>
                            <Link href={'/shop?category=' + x.slug} onClick={close} className='block py-2 text-ink/70'>{x.title}</Link>
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                );
              })}
            </ul>
          ) : (
            <ul className='divide-y divide-ink/10'>
              {usefulLinks.map(([label, href]) => (
                <li key={href}>
                  <Link href={href} onClick={close} className='block py-4 text-[15px]'>{label}</Link>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className='border-t border-ink/10 px-5 pt-4 pb-[max(1.25rem,env(safe-area-inset-bottom))]'>
          <Link href='/account' onClick={close} className='flex items-center justify-center gap-2 rounded-2xl bg-brand py-3.5 font-bold text-white'>
            <IconUser width={22} height={22} />
            عضویت / ورود
          </Link>
        </div>
      </aside>
    </div>
  );

  return (
    <>
      <button
        type='button'
        aria-label='منو'
        aria-expanded={open}
        onClick={() => setOpen(true)}
        className='glass-btn grid h-10 w-10 place-items-center rounded-full'
      >
        <IconMenu />
      </button>
      {mounted && createPortal(drawer, document.body)}
    </>
  );
}
