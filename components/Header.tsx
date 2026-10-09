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
      <span className='absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-brand px-1 text-[10px] text-white'>۰</span>
    </Link>
  );
}

export default function Header() {
  return (
    <>
      {/* Promo bar scrolls away; only the main header stays pinned */}
      <div className='bg-night px-4 py-1.5 text-center text-xs text-white md:py-2 md:text-sm'>{site.promo}</div>

      <header className='glass-bar sticky top-0 z-40'>
        {/* Mobile: one compact row */}
        <div className='grid grid-cols-[1fr_auto_1fr] items-center px-2 py-1.5 md:hidden'>
          <details className='justify-self-start'>
            <summary aria-label='منو' className='glass-btn grid h-10 w-10 cursor-pointer list-none place-items-center rounded-full [&::-webkit-details-marker]:hidden'>
              <IconMenu />
            </summary>
            <nav className='glass-panel absolute inset-x-0 top-full max-h-[75vh] overflow-y-auto px-4 py-4'>
              <Link href='/shop' className='mb-3 block rounded-full bg-brand py-2.5 text-center text-sm font-bold text-white shadow-lg'>همه محصولات</Link>
              <ul className='space-y-2.5'>
                {categories.map((c) => (
                  <li key={c.slug} className='glass-btn !overflow-visible rounded-2xl px-4 py-3'>
                    <Link href={'/shop?category=' + c.slug} className='block text-base font-bold text-ink'>{c.title}</Link>
                    {c.children && (
                      <ul className='mt-2.5 flex flex-wrap gap-2 text-sm'>
                        {c.children.map((x) => (
                          <li key={x.slug}><Link href={'/shop?category=' + x.slug} className='glass-chip inline-block rounded-full px-3 py-1'>{x.title}</Link></li>
                        ))}
                      </ul>
                    )}
                  </li>
                ))}
              </ul>
            </nav>
          </details>

          <Link href='/' aria-label={site.name}><Logo uid='hm' /></Link>

          <div className='flex items-center justify-self-end'>
            <details>
              <summary aria-label='جستجو' className='glass-btn mx-1 grid h-10 w-10 cursor-pointer list-none place-items-center rounded-full [&::-webkit-details-marker]:hidden'>
                <IconSearch />
              </summary>
              <div className='glass-panel absolute inset-x-0 top-full p-3'>
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
