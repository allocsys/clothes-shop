import Link from 'next/link';
import Hero from '@/components/Hero';
import GarmentArt from '@/components/GarmentArt';
import ProductCard from '@/components/ProductCard';
import SectionHeading from '@/components/SectionHeading';
import { IconChat, IconReturn, IconShield, IconTruck } from '@/components/Icons';
import { categories } from '@/data/categories';
import { products } from '@/data/products';
import { site } from '@/lib/site';

// TODO: edit these to match your real policies
const trust = [
  { Icon: IconTruck, title: 'ارسال سریع', text: 'به همه شهرها' },
  { Icon: IconShield, title: 'پرداخت امن', text: 'درگاه معتبر بانکی' },
  { Icon: IconChat, title: 'پشتیبانی', text: 'پاسخ در همان روز' },
  { Icon: IconReturn, title: 'بازگشت کالا', text: 'طبق قوانین فروشگاه' },
];

export default function HomePage() {
  const discounted = products.filter((p) => p.oldPrice);
  return (
    <>
      <h1 className='sr-only'>{site.name}</h1>
      <Hero />

      <section className='mt-8'>
        <div className='no-scrollbar flex gap-4 overflow-x-auto pb-2 md:justify-between'>
          {categories.map((c) => (
            <Link key={c.slug} href={'/shop?category=' + c.slug} className='flex w-20 shrink-0 flex-col items-center gap-2'>
              <span className='h-[72px] w-[72px] overflow-hidden rounded-full ring-2 ring-brand/20'>
                <GarmentArt category={c.slug} seed={c.slug} />
              </span>
              <span className='text-center text-xs'>{c.title}</span>
            </Link>
          ))}
        </div>
      </section>

      <section className='mt-8 grid grid-cols-2 gap-3 md:grid-cols-4'>
        {trust.map(({ Icon, title, text }) => (
          <div key={title} className='flex items-center gap-3 rounded-2xl bg-white p-3'>
            <span className='grid h-10 w-10 shrink-0 place-items-center rounded-full bg-brand/10 text-brand'>
              <Icon width={22} height={22} />
            </span>
            <div>
              <p className='text-sm font-bold'>{title}</p>
              <p className='text-xs text-ink/60'>{text}</p>
            </div>
          </div>
        ))}
      </section>

      <section className='mt-10'>
        <SectionHeading title='جدیدترین‌ها' href='/shop' />
        <div className='grid grid-cols-2 gap-4 md:grid-cols-4'>
          {products.slice(0, 4).map((p) => (
            <ProductCard key={p.slug} product={p} />
          ))}
        </div>
      </section>

      {discounted.length > 0 && (
        <section className='mt-10'>
          <SectionHeading title='تخفیف‌های ویژه' href='/shop' />
          <div className='grid grid-cols-2 gap-4 md:grid-cols-4'>
            {discounted.map((p) => (
              <ProductCard key={p.slug} product={p} />
            ))}
          </div>
        </section>
      )}
    </>
  );
}
