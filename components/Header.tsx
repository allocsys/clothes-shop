import Link from 'next/link';
import { categories } from '@/data/categories';
import { site } from '@/lib/site';
import Logo from '@/components/Logo';
import { IconBag, IconMenu, IconSearch, IconUser } from '@/components/Icons';

function SearchBar() {
  return (
    <form action='/shop' className='relative w-full'>
      <input
        name='q'
        type='search'
        placeholder='جستجوی محصول...'
        className='w-full rounded-full border border-ink/15 bg-sand py-2.5 pl-4 pr-11 text-sm outline-none focus:border-brand focus:bg-white'
      />
      <button type='submit' aria-label='جستجو' className='absolute right-3 top-1/2 -translate-y-1/2 text-ink/50'>
        <IconSearch width={20} height={20} />
      </button>
    </form>
  );
}

function CartLink() {
  return (
    <Link href='/cart' aria-label='سبد خرید' className='relative p-2'>
      <IconBag />
      <span className='absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-brand px-1 text-[10px] text-white'>۰</span>
    </Link>
  );
}

export default function Header() {
  return (
    <header className='sticky top-0 z-40 bg-white shadow-sm'>
      <div className='bg-night px-4 py-2 text-center text-xs text-white md:text-sm'>{site.promo}</div>

      {/* Mobile */}
      <div className='md:hidden'>
        <div className='grid grid-cols-[1fr_auto_1fr] items-center px-4 py-3'>
          <details className='group justify-self-start'>
            <summary aria-label='منو' className='cursor-pointer list-none p-2 [&::-webkit-details-marker]:hidden'>
              <IconMenu />
            </summary>
            <nav className='absolute inset-x-0 top-full max-h-[70vh] overflow-y-auto border-t border-ink/10 bg-white px-4 py-3 shadow-lg'>
              <ul className='divide-y divide-ink/10'>
                {categories.map((c) => (
                  <li key={c.slug} className='py-2.5'>
                    <Link href={'/shop?category=' + c.slug} className='font-medium'>{c.title}</Link>
                    {c.children && (
                      <ul className='mt-1 flex flex-wrap gap-2 pr-3 text-sm text-ink/60'>
                        {c.children.map((x) => (
                          <li key={x.slug}><Link href={'/shop?category=' + x.slug}>{x.title}</Link></li>
                        ))}
                      </ul>
                    )}
                  </li>
                ))}
              </ul>
            </nav>
          </details>
          <Link href='/' aria-label={site.name}><Logo uid='hm' /></Link>
          <div className='justify-self-end'><CartLink /></div>
        </div>
        <div className='px-4 pb-3'><SearchBar /></div>
      </div>

      {/* Desktop */}
      <div className='mx-auto hidden max-w-7xl items-center gap-6 px-4 py-3 md:flex'>
        <Link href='/' aria-label={site.name}><Logo uid='hd' /></Link>
        <div className='flex-1'><SearchBar /></div>
        <Link href='/account' className='flex items-center gap-2 text-sm'><IconUser width={22} height={22} />ورود / ثبت‌نام</Link>
        <CartLink />
      </div>
      <nav className='hidden border-t border-ink/10 md:block'>
        <ul className='mx-auto flex max-w-7xl gap-7 px-4 py-2.5 text-sm'>
          {categories.map((c) => (
            <li key={c.slug}><Link href={'/shop?category=' + c.slug} className='hover:text-brand'>{c.title}</Link></li>
          ))}
        </ul>
      </nav>
    </header>
  );
}
