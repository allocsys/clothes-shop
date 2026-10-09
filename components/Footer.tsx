import Link from 'next/link';
import { site } from '@/lib/site';
import Logo from '@/components/Logo';
import { IconChat, IconReturn, IconShield, IconTruck } from '@/components/Icons';

// TODO: edit these to match your real policies
const trust = [
  { Icon: IconTruck, title: 'ارسال سریع', text: 'به همه شهرها' },
  { Icon: IconShield, title: 'پرداخت امن', text: 'درگاه معتبر بانکی' },
  { Icon: IconChat, title: 'پشتیبانی', text: 'پاسخ در همان روز' },
  { Icon: IconReturn, title: 'بازگشت کالا', text: 'طبق قوانین فروشگاه' },
];

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
      <div className='mx-auto max-w-7xl px-4 pt-10'>
        <div className='grid grid-cols-2 gap-3 md:grid-cols-4'>
          {trust.map(({ Icon, title, text }) => (
            <div key={title} className='flex items-center gap-3 rounded-2xl bg-white/5 p-3'>
              <span className='grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white/10 text-white'>
                <Icon width={22} height={22} />
              </span>
              <div>
                <p className='text-sm font-bold'>{title}</p>
                <p className='text-xs text-white/60'>{text}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
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
