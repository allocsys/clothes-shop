'use client';

import Link from 'next/link';
import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react';
import { formatDateTime } from '@/lib/adminDate';
import { formatPrice } from '@/lib/format';
import { STATUS_LABEL, isStatus } from '@/lib/orderStatus';
import { normalizeOrderCode } from '@/lib/orderCode';
import { forgetLastOrder, readLastOrder } from '@/lib/lastOrder';
import type { TrackedOrder } from '@/lib/orderTracking';

// The four steps a normal order goes through. A canceled order has its own banner instead.
const STEPS = ['new', 'confirmed', 'shipped', 'delivered'] as const;
const STEP_TEXT: Record<string, string> = {
  new: 'سفارش شما ثبت شد و منتظر تأیید فروشگاه است.',
  confirmed: 'سفارش شما تأیید شد و در حال آماده‌سازی است.',
  shipped: 'سفارش شما ارسال شد.',
  delivered: 'سفارش شما تحویل داده شد.',
  canceled: 'این سفارش لغو شده است.',
};

const field = 'w-full rounded-xl border border-ink/15 bg-surface px-4 py-3 text-sm text-ink outline-none focus:border-brand';

export default function TrackForm({ initialCode = '' }: { initialCode?: string }) {
  const [code, setCode] = useState(initialCode);
  const [mobile, setMobile] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [order, setOrder] = useState<TrackedOrder | null>(null);

  const [remembered, setRemembered] = useState(false);
  const autoTried = useRef(false);

  const lookup = useCallback(async (c: string, m: string) => {
    setError('');
    setBusy(true);
    try {
      const res = await fetch('/api/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: c, mobile: m }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.ok) {
        setError(data?.error || 'پیگیری انجام نشد. دوباره تلاش کنید.');
        return false;
      }
      setOrder(data.order);
      return true;
    } catch {
      setError('ارتباط با سرور برقرار نشد.');
      return false;
    } finally {
      setBusy(false);
    }
  }, []);

  // Same device as the purchase: open the tracking straight away.
  // With ?code= only a matching remembered order is used; with no code, the last order placed here is used.
  useEffect(() => {
    if (autoTried.current) return;
    autoTried.current = true;
    const last = readLastOrder();
    if (!last) return;
    if (initialCode && normalizeOrderCode(last.code) !== normalizeOrderCode(initialCode)) return;
    setCode(last.code);
    setMobile(last.mobile);
    setRemembered(true);
    void lookup(last.code, last.mobile).then((ok) => {
      if (!ok) {
        // Order not found any more: forget it and show the normal form.
        forgetLastOrder();
        setRemembered(false);
        setMobile('');
        setError('');
      }
    });
  }, [initialCode, lookup]);

  function submit(e: FormEvent) {
    e.preventDefault();
    void lookup(code, mobile);
  }

  if (order) {
    const canceled = order.status === 'canceled';
    const step = STEPS.indexOf(order.status as (typeof STEPS)[number]);
    const label = isStatus(order.status) ? STATUS_LABEL[order.status] : order.status;
    return (
      <section aria-live='polite' className='rounded-3xl bg-surface p-6'>
        <p className='text-sm text-ink/70'>کد پیگیری: <span className='font-bold text-brand' dir='ltr'>{order.code}</span></p>
        <p className='mt-1 text-xs text-ink/70'>ثبت‌شده در {formatDateTime(order.createdAt)}</p>

        {canceled ? (
          <p className='mt-5 rounded-2xl bg-rose/10 px-4 py-3 text-sm font-bold text-rose'>{STEP_TEXT.canceled}</p>
        ) : (
          <>
            <ol className='mt-6 grid grid-cols-4 gap-1 text-center' aria-label='مراحل سفارش'>
              {STEPS.map((s, i) => (
                <li key={s} aria-current={i === step ? 'step' : undefined} className='flex flex-col items-center gap-2'>
                  <span className={'grid h-8 w-8 place-items-center rounded-full text-xs font-bold ' + (i <= step ? 'bg-brand text-white' : 'bg-ink/10 text-ink/70')}>
                    {i < step ? '✓' : new Intl.NumberFormat('fa-IR').format(i + 1)}
                  </span>
                  <span className={'text-[11px] leading-4 ' + (i === step ? 'font-bold text-brand' : 'text-ink/70')}>{STATUS_LABEL[s]}</span>
                </li>
              ))}
            </ol>
            <p className='mt-5 text-sm font-bold'>{STEP_TEXT[order.status] ?? label}</p>
          </>
        )}

        {order.paymentStatus === 'paid' && <p className='mt-3 text-sm font-bold text-brand'>پرداخت انجام شده است.</p>}
        {order.paymentStatus === 'unpaid' && order.payOnline && !canceled && (
          <div className='mt-3 text-sm'>
            <p className='text-ink/70'>پرداخت آنلاین این سفارش هنوز انجام نشده است.</p>
            <Link href={'/order/' + order.code} className='mt-2 inline-block font-bold text-brand underline'>پرداخت سفارش</Link>
          </div>
        )}

        <ul className='mt-6 divide-y divide-ink/10 border-t border-ink/10 text-sm'>
          {order.items.map((it, i) => (
            <li key={i} className='flex items-start justify-between gap-3 py-3'>
              <div>
                <p className='font-bold'>{it.title}</p>
                <p className='mt-0.5 text-xs text-ink/70'>{it.size} · {it.color} · {new Intl.NumberFormat('fa-IR').format(it.qty)} عدد</p>
              </div>
              <span className='shrink-0 text-ink/80'>{formatPrice(it.unitPrice * it.qty)}</span>
            </li>
          ))}
        </ul>
        <dl className='mt-2 space-y-1 border-t border-ink/10 pt-3 text-sm'>
          <div className='flex justify-between'><dt className='text-ink/70'>جمع کالاها</dt><dd>{formatPrice(order.subtotal)}</dd></div>
          <div className='flex justify-between'><dt className='text-ink/70'>هزینه ارسال</dt><dd>{order.shipping === 0 ? 'رایگان' : formatPrice(order.shipping)}</dd></div>
          <div className='flex justify-between text-base font-bold'><dt>مبلغ کل</dt><dd>{formatPrice(order.total)}</dd></div>
        </dl>

        <button type='button' onClick={() => { setOrder(null); setMobile(''); setCode(''); }} className='mt-6 w-full rounded-full bg-surface py-3 font-bold text-brand ring-1 ring-brand/30'>
          پیگیری سفارش دیگر
        </button>
        {remembered && (
          <button type='button' onClick={() => { forgetLastOrder(); setRemembered(false); setOrder(null); setCode(''); setMobile(''); }} className='mt-3 w-full text-center text-xs text-ink/70 underline'>
            این سفارش را از این دستگاه فراموش کن
          </button>
        )}
      </section>
    );
  }

  return (
    <form onSubmit={submit} className='grid gap-4 rounded-3xl bg-surface p-6'>
      <div className='grid gap-1.5'>
        <label htmlFor='track-code' className='text-sm text-ink/70'>کد پیگیری</label>
        <input id='track-code' dir='ltr' autoCapitalize='characters' autoComplete='off' spellCheck={false} value={code} onChange={(e) => setCode(e.target.value)} placeholder='MP-AB12CD34' className={field} />
      </div>
      <div className='grid gap-1.5'>
        <label htmlFor='track-mobile' className='text-sm text-ink/70'>شماره موبایل ثبت‌شده در سفارش</label>
        <input id='track-mobile' dir='ltr' inputMode='tel' autoComplete='tel' value={mobile} onChange={(e) => setMobile(e.target.value)} placeholder='09123456789' className={field} />
      </div>
      {error && <p role='alert' className='text-sm text-rose'>{error}</p>}
      <button disabled={busy || !code.trim() || !mobile.trim()} className='rounded-full bg-brand py-3 font-bold text-white disabled:opacity-50'>
        {busy ? 'در حال جستجو...' : 'پیگیری سفارش'}
      </button>
    </form>
  );
}
