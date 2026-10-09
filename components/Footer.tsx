import Link from 'next/link';
import { site } from '@/lib/site';

const links = [
  ['درباره ما', '/pages/about-us'],
  ['تماس با ما', '/pages/contact-us'],
  ['سوالات متداول', '/pages/faq'],
  ['رویه بازگشت کالا', '/pages/return-policy'],
  ['قوانین و مقررات', '/pages/terms-and-conditions'],
];

export default function Footer() {
  return (
    <footer className='mt-10 bg-ink text-white'>
      <div className='mx-auto grid max-w-7xl gap-8 px-4 py-10 md:grid-cols-3'>
        <div>
          <p className='text-lg font-bold'>{site.name}</p>
          <p className='mt-2 text-sm text-white/70'>{site.tagline}</p>
        </div>
        <ul className='space-y-2 text-sm'>
          {links.map(([label, href]) => (
            <li key={href}><Link href={href} className='text-white/80 hover:text-white'>{label}</Link></li>
          ))}
        </ul>
        <div className='text-sm text-white/70'>
          {/* TODO: phone, email, social links */}
          <p>تلفن و راه‌های ارتباطی را اینجا اضافه کنید.</p>
        </div>
      </div>
    </footer>
  );
}
