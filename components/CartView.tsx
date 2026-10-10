'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import ProductImage from '@/components/ProductImage';
import { MAX_QTY, useCart } from '@/components/CartProvider';
import { useProducts } from '@/components/useProducts';
import { FREE_SHIPPING_FROM, isValidIranMobile, priceOrder } from '@/lib/checkout';
import { formatPrice } from '@/lib/format';

const fa = (n: number) => new Intl.NumberFormat('fa-IR').format(n);

const field =
  'w-full rounded-xl border border-ink/15 bg-surface px-4 py-3 text-sm text-ink outline-none focus:border-brand';

type Done = { code: string; total: number; payError?: boolean };

export default function CartView() {
  const { lines, ready, setQty, remove, clear } = useCart();
  const { products, loading } = useProducts(lines.map((l) => l.slug));
  const [form, setForm] = useState({ name: '', phone: '', city: '', address: '', postalCode: '', notes: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<Done | null>(null);

  const set = (k: keyof typeof form) => (e: { target: { value: string } }) => setForm((f) => ({ ...f, [k]: e.target.value }));

  if (done) {
    return (
      <section className='mx-auto mt-10 max-w-md rounded-3xl bg-surface p-8 text-center'>
        <div className='mx-auto grid h-14 w-14 place-items-center rounded-full bg-brand/15 text-brand'>
          <svg width='28' height='28' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2.4' strokeLinecap='round' strokeLinejoin='round' aria-hidden='true'>
            <path d='M5 13l4 4L19 7' />
          </svg>
        </div>
        <h1 className='mt-4 text-xl font-bold'>سفارش شما ثبت شد</h1>
        <p className='mt-2 text-sm text-ink/70'>کد پیگیری: <span className='font-bold text-brand' dir='ltr'>{done.code}</span></p>
        <p className='mt-1 text-sm text-ink/70'>مبلغ کل: {formatPrice(done.total)}</p>
        {done.payError ? (
          <>
            <p className='mt-4 text-xs leading-6 text-rose'>اتصال به درگاه پرداخت برقرار نشد. سفارش شما نگه داشته شده است؛ می‌توانید از صفحه سفارش پرداخت را انجام دهید.</p>
            <Link href={'/order/' + done.code} className='mt-4 inline-block rounded-full bg-brand px-8 py-3 font-bold text-white'>پرداخت سفارش</Link>
          </>
        ) : (
          <p className='mt-4 text-xs leading-6 text-ink/50'>پرداخت آنلاین هنوز فعال نشده است. فروشگاه برای هماهنگی با شما تماس می‌گیرد.</p>
        )}
        <p className='mt-4 text-xs leading-6 text-ink/50'>کد پیگیری را نگه دارید؛ با آن و شماره موبایلتان می‌توانید وضعیت سفارش را ببینید.</p>
        <Link href={'/track?code=' + done.code} className='mt-3 inline-block font-bold text-brand underline'>پیگیری سفارش</Link>
        <div>
          <Link href='/shop' className='mt-6 inline-block rounded-full bg-brand px-8 py-3 font-bold text-white'>ادامه خرید</Link>
        </div>
      </section>
    );
  }

  if (!ready || loading) return <p className='py-20 text-center text-ink/50'>در حال بارگذاری...</p>;

  const detailed = lines.flatMap((l) => {
    const p = products.find((x) => x.slug === l.slug);
    return p ? [{ line: l, product: p }] : [];
  });

  if (detailed.length === 0) {
    return (
      <section className='py-20 text-center'>
        <p className='text-ink/60'>سبد خرید شما خالی است.</p>
        <Link href='/shop' className='mt-5 inline-block rounded-full bg-brand px-8 py-3 font-bold text-white'>مشاهده محصولات</Link>
      </section>
    );
  }

  const { subtotal, shipping, total } = priceOrder(detailed.map((d) => d.line), products);
  const missing = FREE_SHIPPING_FROM - subtotal;

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError('');
    if (!form.name.trim() || !form.city.trim() || !form.address.trim()) {
      setError('نام، شهر و آدرس را کامل وارد کنید.');
      return;
    }
    if (!isValidIranMobile(form.phone)) {
      setError('شماره موبایل معتبر نیست (مثال: ۰۹۱۲۳۴۵۶۷۸۹).');
      return;
    }
    setBusy(true);
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customer: form, items: detailed.map((d) => d.line) }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setError(data.error || 'ثبت سفارش انجام نشد. دوباره تلاش کنید.');
        return;
      }
      clear();
      if (data.payUrl) {
        // Online payment: go to the gateway (keep the button busy while the browser leaves).
        window.location.href = data.payUrl;
        return;
      }
      setDone({ code: data.code, total: data.total, payError: Boolean(data.payError) });
    } catch {
      setError('ارتباط با سرور برقرار نشد. دوباره تلاش کنید.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className='mt-6 grid gap-6 md:grid-cols-[1fr_380px]'>
      <section>
        <h1 className='mb-4 text-xl font-bold'>سبد خرید</h1>
        <ul className='space-y-3'>
          {detailed.map(({ line, product }) => (
            <li key={line.slug + line.size + line.color} className='flex gap-3 rounded-2xl bg-surface p-3'>
              <Link href={'/product/' + product.slug} className='relative h-28 w-24 shrink-0 overflow-hidden rounded-xl'>
                <ProductImage image={product.images?.[0]} category={product.category} seed={product.slug} alt={product.title} sizes='96px' />
              </Link>
              <div className='flex min-w-0 flex-1 flex-col'>
                <Link href={'/product/' + product.slug} className='font-bold'>{product.title}</Link>
                <p className='mt-1 text-xs text-ink/60'>سایز {line.size} · {line.color}</p>
                <div className='mt-auto flex items-end justify-between pt-2'>
                  <div className='flex items-center rounded-full border border-ink/15'>
                    <button type='button' aria-label='کم کردن' onClick={() => setQty(line, line.qty - 1)} className='grid h-9 w-9 place-items-center text-lg'>−</button>
                    <span className='min-w-6 text-center text-sm font-bold'>{fa(line.qty)}</span>
                    <button type='button' aria-label='زیاد کردن' disabled={line.qty >= MAX_QTY} onClick={() => setQty(line, line.qty + 1)} className='grid h-9 w-9 place-items-center text-lg disabled:opacity-30'>+</button>
                  </div>
                  <div className='text-left'>
                    <p className='text-sm font-bold text-brand'>{formatPrice(product.price * line.qty)}</p>
                    <button type='button' onClick={() => remove(line)} className='text-xs text-rose'>حذف</button>
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <form onSubmit={submit} className='h-fit rounded-3xl bg-surface p-5 md:sticky md:top-28'>
        <h2 className='font-bold'>خلاصه سفارش</h2>
        <dl className='mt-3 space-y-2 text-sm'>
          <div className='flex justify-between'><dt className='text-ink/70'>جمع کالاها</dt><dd>{formatPrice(subtotal)}</dd></div>
          <div className='flex justify-between'><dt className='text-ink/70'>هزینه ارسال</dt><dd>{shipping === 0 ? 'رایگان' : formatPrice(shipping)}</dd></div>
          <div className='flex justify-between border-t border-ink/10 pt-2 font-bold'><dt>مبلغ قابل پرداخت</dt><dd className='text-brand'>{formatPrice(total)}</dd></div>
        </dl>
        {missing > 0 && (
          <p className='mt-2 text-xs text-ink/50'>با {formatPrice(missing)} خرید بیشتر، ارسال رایگان می‌شود.</p>
        )}

        <h2 className='mb-3 mt-6 font-bold'>اطلاعات ارسال</h2>
        <div className='space-y-3'>
          <input className={field} placeholder='نام و نام خانوادگی' autoComplete='name' value={form.name} onChange={set('name')} />
          <input className={field} placeholder='شماره موبایل' inputMode='tel' autoComplete='tel' dir='ltr' style={{ textAlign: 'right' }} value={form.phone} onChange={set('phone')} />
          <div className='grid grid-cols-2 gap-3'>
            <input className={field} placeholder='شهر' autoComplete='address-level2' value={form.city} onChange={set('city')} />
            <input className={field} placeholder='کد پستی (اختیاری)' inputMode='numeric' autoComplete='postal-code' value={form.postalCode} onChange={set('postalCode')} />
          </div>
          <textarea className={field + ' min-h-24'} placeholder='آدرس کامل' autoComplete='street-address' value={form.address} onChange={set('address')} />
          <textarea className={field + ' min-h-16'} placeholder='توضیحات (اختیاری)' value={form.notes} onChange={set('notes')} />
        </div>

        {error && <p role='alert' className='mt-3 text-sm text-rose'>{error}</p>}

        <button type='submit' disabled={busy} className='mt-5 w-full rounded-full bg-brand py-3.5 font-bold text-white disabled:opacity-60'>
          {busy ? 'در حال ثبت...' : 'ثبت سفارش'}
        </button>
        <p className='mt-2 text-center text-xs text-ink/50'>پرداخت آنلاین به‌زودی فعال می‌شود.</p>
      </form>
    </div>
  );
}
