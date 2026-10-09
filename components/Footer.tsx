import Link from 'next/link';
import { site } from '@/lib/site';
import Logo from '@/components/Logo';

const links = [
  ['درباره ما', '/pages/about-us'],
  ['تماس با ما', '/pages/contact-us'],
  ['سوالات متداول', '/pages/faq'],
  ['رویه بازگشت کالا', '/pages/return-policy'],
  ['قوانین و مقررات', '/pages/terms-and-conditions'],
];

// TODO: replace with your real social links
const socials = [
  ['اینستاگرام', '#'],
  ['تلگرام', '#'],
  ['ایتا', '#'],
];

export default function Footer() {
  return (
    <footer className='mt-8 bg-night text-white'>
      <div className='mx-auto grid max-w-7xl gap-10 px-4 py-12 md:grid-cols-4'>
        <div className='md:col-span-2'>
          <Logo light uid='ft' />
          <p className='mt-4 max-w-sm text-sm leading-7 text-white/70'>{site.tagline}</p>
        </div>
        <div>
          <h3 className='mb-3 font-bold'>راهنما</h3>
          <ul className='space-y-2 text-sm'>
            {links.map(([label, href]) => (
              <li key={href}><Link href={href} className='text-white/70 hover:text-white'>{label}</Link></li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className='mb-3 font-bold'>ارتباط با ما</h3>
          <ul className='space-y-2 text-sm'>
            {socials.map(([label, href]) => (
              <li key={label}><a href={href} className='text-white/70 hover:text-white'>{label}</a></li>
            ))}
          </ul>
        </div>
      </div>
      <div className='border-t border-white/10 px-4 py-4 pb-24 text-center text-xs text-white/50 md:pb-4'>
        تمام حقوق برای {site.name} محفوظ است.
      </div>
    </footer>
  );
}
