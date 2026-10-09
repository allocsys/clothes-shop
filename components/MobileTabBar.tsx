'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { IconBag, IconHome, IconStore, IconUser } from '@/components/Icons';

const tabs = [
  { label: 'خانه', href: '/', Icon: IconHome },
  { label: 'فروشگاه', href: '/shop', Icon: IconStore },
  { label: 'سبد خرید', href: '/cart', Icon: IconBag },
  { label: 'حساب من', href: '/account', Icon: IconUser },
];

export default function MobileTabBar() {
  const pathname = usePathname();
  return (
    <nav className='fixed inset-x-0 bottom-0 z-50 grid grid-cols-4 border-t border-ink/10 bg-white pb-2 pt-2 shadow-[0_-4px_16px_rgba(36,26,71,0.08)] md:hidden'>
      {tabs.map(({ label, href, Icon }) => {
        const active = href === '/' ? pathname === '/' : pathname.startsWith(href);
        return (
          <Link key={href} href={href} className={'flex flex-col items-center gap-1 text-[11px] ' + (active ? 'font-bold text-brand' : 'text-ink/60')}>
            <Icon width={22} height={22} />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
