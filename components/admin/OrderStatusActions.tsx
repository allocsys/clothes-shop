'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { allowedNext, STATUS_LABEL, type OrderStatus } from '@/lib/orderStatus';

const VERB: Record<OrderStatus, string> = {
  new: 'برگردان به «جدید»',
  confirmed: 'تأیید سفارش',
  shipped: 'ارسال شد',
  delivered: 'تحویل داده شد',
  canceled: 'لغو سفارش',
};

export default function OrderStatusActions({ orderId, status }: { orderId: number; status: OrderStatus }) {
  const router = useRouter();
  const [armed, setArmed] = useState<OrderStatus | null>(null); // a risky button waiting for its second tap
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const options = allowedNext(status);

  async function go(to: OrderStatus) {
    if (busy) return;
    if (to === 'canceled' && armed !== 'canceled') {
      setArmed('canceled');
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => setArmed(null), 4000);
      return;
    }
    setArmed(null);
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch('/api/admin/orders/' + orderId, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: to, from: status }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setMessage({
          ok: true,
          text: to === 'canceled' ? 'سفارش لغو شد و موجودی کالاها برگشت.' : `وضعیت شد «${STATUS_LABEL[to]}».`,
        });
        router.refresh();
      } else if (res.status === 409) {
        setMessage({ ok: false, text: 'وضعیت این سفارش در همین فاصله عوض شده. صفحه تازه می‌شود.' });
        router.refresh();
      } else if (res.status === 401) {
        setMessage({ ok: false, text: 'نشست شما تمام شده است. دوباره وارد شوید.' });
        router.replace('/admin/login');
      } else {
        setMessage({ ok: false, text: 'انجام نشد. دوباره تلاش کنید.' });
      }
    } catch {
      setMessage({ ok: false, text: 'ارتباط با سرور برقرار نشد.' });
    } finally {
      setBusy(false);
    }
  }

  if (options.length === 0) {
    return <p className='mt-3 rounded-2xl bg-surface p-3 text-sm text-ink/70'>این سفارش لغو شده و وضعیتش قابل تغییر نیست.</p>;
  }

  return (
    <div className='mt-3'>
      <div className='flex flex-wrap gap-2'>
        {options.map((to, i) => {
          const danger = to === 'canceled';
          const back = !danger && (to === 'new' || (status === 'delivered' && to === 'shipped') || (status === 'shipped' && to === 'confirmed'));
          const cls = danger
            ? armed === 'canceled' ? 'border-rose bg-rose text-white' : 'border-rose/40 text-rose'
            : back ? 'border-ink/20' : 'border-brand bg-brand font-bold text-white';
          return (
            <button key={to} type='button' disabled={busy} onClick={() => go(to)} className={'rounded-full border px-4 py-2.5 text-sm disabled:opacity-50 ' + cls + (i === 0 && !danger && !back ? ' flex-1' : '')}>
              {danger && armed === 'canceled' ? 'مطمئنی؟ لغو شود' : back ? '↩ ' + VERB[to] : VERB[to]}
            </button>
          );
        })}
      </div>
      {armed === 'canceled' && <p className='mt-2 text-xs text-ink/60'>با لغو، کالاهای این سفارش به موجودی برمی‌گردند و دیگر نمی‌شود وضعیت را عوض کرد.</p>}
      <div aria-live='polite' className={'mt-2 min-h-5 text-sm ' + (message?.ok ? 'text-brand' : 'text-rose')}>{message?.text}</div>
    </div>
  );
}
