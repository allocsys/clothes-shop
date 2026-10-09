import Link from 'next/link';

const tabs = [
  ['خانه', '/'],
  ['فروشگاه', '/shop'],
  ['سبد خرید', '/cart'],
  ['حساب من', '/account'],
];

export default function MobileTabBar() {
  return (
    <nav className='fixed inset-x-0 bottom-0 z-50 grid grid-cols-4 border-t border-ink/10 bg-white py-3 text-center text-xs shadow-[0_0_8px_rgba(0,0,0,0.12)] md:hidden'>
      {tabs.map(([label, href]) => (
        <Link key={href} href={href}>{label}</Link>
      ))}
    </nav>
  );
}
