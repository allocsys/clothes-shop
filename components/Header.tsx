import Link from 'next/link';
import { categories } from '@/data/categories';
import { site } from '@/lib/site';

export default function Header() {
  return (
    <header className='sticky top-0 z-40 border-b border-ink/10 bg-white'>
      <div className='bg-brand px-4 py-2 text-center text-sm text-white'>{site.promo}</div>
      <div className='mx-auto flex max-w-7xl items-center gap-4 px-4 py-3'>
        <Link href='/' className='text-xl font-bold text-brand'>{site.name}</Link>
        <form action='/shop' className='flex-1'>
          <input
            name='q'
            type='search'
            placeholder='جستجوی محصول...'
            className='w-full rounded-lg border border-ink/20 px-3 py-2 text-sm outline-none focus:border-brand'
          />
        </form>
        <Link href='/account' className='hidden text-sm md:block'>ورود / ثبت‌نام</Link>
        <Link href='/cart' className='text-sm'>سبد خرید (۰)</Link>
      </div>
      <nav className='hidden border-t border-ink/10 md:block'>
        <ul className='mx-auto flex max-w-7xl gap-6 px-4 py-2 text-sm'>
          {categories.map((c) => (
            <li key={c.slug}>
              <Link href={'/shop?category=' + c.slug} className='hover:text-brand'>{c.title}</Link>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  );
}
