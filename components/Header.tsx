import Link from 'next/link';
import { categories } from '@/data/categories';
import { site } from '@/lib/site';
import Logo from '@/components/Logo';
import MobileMenu from '@/components/MobileMenu';
import CartCount from '@/components/CartCount';
import { IconBag, IconSearch, IconUser } from '@/components/Icons';

function SearchBar() {
  return (
    <form action='/shop' className='relative w-full'>
      <input
        name='q'
        type='search'
        placeholder='جستجوی محصول...'
        className='w-full rounded-full glass-field py-2.5 pl-4 pr-11 text-sm outline-none focus:border-brand'
      />
      <button type='submit' aria-label='جستجو' className='absolute right-3 top-1/2 -translate-y-1/2 text-ink/50'>
        <IconSearch width={20} height={20} />
      </button>
    </form>
  );
}

function CartLink() {
  return (
    <Link href='/cart' aria-label='سبد خرید' className='glass-btn !overflow-visible relative grid h-10 w-10 place-items-center rounded-full'>
      <IconBag />
      <CartCount />
    </Link>
  );
}

export default function Header() {
  return (
    <>
      {/* Promo bar scrolls away; only the main header stays pinned */}
      <div className='bg-night px-4 py-1.5 text-center text-xs text-white md:py-2 md:text-sm'>{site.promo}</div>

      <header className='glass-bar sticky top-0 z-40'>
        {/* Mobile: one compact row. The menu is a slide-in drawer (see MobileMenu) */}
        <div className='grid grid-cols-[1fr_auto_1fr] items-center px-2 py-1.5 md:hidden'>
          <div className='justify-self-start'>
            <MobileMenu categories={categories} name={site.name} />
          </div>

          <Link href='/' aria-label={site.name}><Logo uid='hm' /></Link>

          <div className='flex items-center justify-self-end'>
            <details>
              <summary aria-label='جستجو' className='glass-btn mx-1 grid h-10 w-10 cursor-pointer list-none place-items-center rounded-full [&::-webkit-details-marker]:hidden'>
                <IconSearch />
              </summary>
              <div className='absolute inset-x-0 top-full border-t border-ink/10 bg-sand p-3 shadow-2xl'>
                <SearchBar />
              </div>
            </details>
            <CartLink />
          </div>
        </div>

        {/* Desktop */}
        <div className='mx-auto hidden max-w-7xl items-center gap-6 px-4 py-3 md:flex'>
          <Link href='/' aria-label={site.name}><Logo uid='hd' /></Link>
          <div className='flex-1'><SearchBar /></div>
          <Link href='/account' className='glass-btn flex items-center gap-2 rounded-full px-4 py-2 text-sm'><IconUser width={22} height={22} />ورود / ثبت‌نام</Link>
          <CartLink />
        </div>
        <nav className='hidden border-t border-ink/10 md:block'>
          <ul className='mx-auto flex max-w-7xl gap-2 px-4 py-2 text-sm'>
            {categories.map((c) => (
              <li key={c.slug}><Link href={'/shop?category=' + c.slug} className='glass-btn inline-block rounded-full px-4 py-1.5 hover:text-brand'>{c.title}</Link></li>
            ))}
          </ul>
        </nav>
      </header>
    </>
  );
}
