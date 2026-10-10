import Link from 'next/link';
import { site } from '@/lib/site';
import Logo from '@/components/Logo';
import ScrollTop from '@/components/ScrollTop';
import { IconChat, IconChevronLeft, IconPhone, IconPin, IconReturn, IconShield, IconTruck } from '@/components/Icons';

// TODO: edit these to match your real policies
const trust = [
  { Icon: IconTruck, title: 'ارسال سریع', text: 'به همه شهرها' },
  { Icon: IconShield, title: 'پرداخت امن', text: 'درگاه معتبر بانکی' },
  { Icon: IconChat, title: 'پشتیبانی', text: 'پاسخ در همان روز' },
  { Icon: IconReturn, title: 'بازگشت کالا', text: 'طبق قوانین فروشگاه' },
];

const usefulLinks = [
  ['صفحه نخست', '/'],
  ['فروشگاه', '/shop'],
  ['سوالات متداول', '/pages/faq'],
  ['تماس با ما', '/pages/contact-us'],
  ['درباره ما', '/pages/about-us'],
];

const quickLinks = [
  ['حساب کاربری من', '/account'],
  ['علاقه‌مندی‌ها', '/wishlist'],
  ['سبد خرید', '/cart'],
  ['پیگیری سفارش', '/track'],
  ['رویه بازگشت کالا', '/pages/return-policy'],
  ['قوانین و مقررات', '/pages/terms-and-conditions'],
];

function LinkList({ title, items }: { title: string; items: string[][] }) {
  return (
    <div>
      <h3 className='mb-4 flex items-center gap-2 text-lg font-bold'>
        <span className='h-5 w-1.5 rounded-full bg-gold' />
        {title}
      </h3>
      <ul className='text-sm'>
        {items.map(([label, href]) => (
          <li key={href}>
            <Link href={href} className='flex items-center gap-2 py-2.5 text-white/70 hover:text-white'>
              <IconChevronLeft width={14} height={14} className='shrink-0 text-gold' />
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function Footer() {
  const { address, phone } = site.contact;
  const socials = site.socials.filter((s) => s.href && s.href !== '#');

  return (
    <footer className='mt-10 rounded-t-[2rem] border-t border-white/15 bg-night text-white shadow-[0_-8px_30px_rgba(0,0,0,0.25)] dark:bg-[#2d2748]'>
      <div className='mx-auto max-w-7xl px-4 pt-10'>
        <div className='grid grid-cols-2 gap-3 md:grid-cols-4'>
          {trust.map(({ Icon, title, text }) => (
            <div key={title} className='flex items-center gap-3 rounded-2xl bg-white/[0.07] p-3'>
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

      <div className='mx-auto grid max-w-7xl gap-8 px-4 py-10 md:grid-cols-4'>
        <div className='rounded-3xl bg-white/[0.07] p-5 md:col-span-2'>
          <Logo light uid='ft' />
          <h3 className='mb-3 mt-5 flex items-center gap-2 text-lg font-bold'>
            <span className='h-5 w-1.5 rounded-full bg-gold' />
            درباره {site.name}
          </h3>
          <p className='text-sm leading-8 text-white/70'>{site.tagline}</p>

          {(address || phone) && (
            <div className='mt-5 space-y-3 border-t border-white/10 pt-5'>
              {address && (
                <div className='flex items-start gap-3'>
                  <span className='grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-white/10 text-gold'>
                    <IconPin width={22} height={22} />
                  </span>
                  <div>
                    <p className='text-xs text-white/50'>آدرس فروشگاه:</p>
                    <p className='text-sm leading-7'>{address}</p>
                  </div>
                </div>
              )}
              {phone && (
                <div className='flex items-start gap-3'>
                  <span className='grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-white/10 text-gold'>
                    <IconPhone width={22} height={22} />
                  </span>
                  <div>
                    <p className='text-xs text-white/50'>شماره تماس:</p>
                    <a href={'tel:' + phone} className='text-sm leading-7'>{phone}</a>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <LinkList title='لینک‌های مفید' items={usefulLinks} />
        <LinkList title='دسترسی سریع' items={quickLinks} />
      </div>

      <div className='mx-auto flex max-w-7xl flex-col items-center gap-4 px-4 pb-8'>
        {socials.length > 0 && (
          <ul className='flex flex-wrap justify-center gap-2'>
            {socials.map((s) => (
              <li key={s.label}>
                <a href={s.href} target='_blank' rel='noopener noreferrer' className='rounded-full bg-white/10 px-4 py-2 text-sm text-white/80 hover:bg-white/20 hover:text-white'>
                  {s.label}
                </a>
              </li>
            ))}
          </ul>
        )}
        <ScrollTop />
      </div>

      <div className='border-t border-white/10 px-4 py-4 pb-24 text-center text-xs text-white/50 md:pb-4'>
        تمام حقوق برای {site.name} محفوظ است.
      </div>
    </footer>
  );
}
