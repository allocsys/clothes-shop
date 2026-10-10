'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

// Second tap confirms, like canceling an order: it cannot be undone from here.
export default function RefundDoneButton({ paymentId }: { paymentId: number }) {
  const router = useRouter();
  const [armed, setArmed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function go() {
    if (busy) return;
    if (!armed) {
      setArmed(true);
      setTimeout(() => setArmed(false), 4000);
      return;
    }
    setBusy(true);
    setError('');
    try {
      const res = await fetch(`/api/admin/payments/${paymentId}/refunded`, { method: 'POST' });
      if (res.ok || res.status === 409) router.refresh();
      else setError(res.status === 401 ? 'نشست شما تمام شده؛ دوباره وارد شوید.' : 'ثبت نشد. دوباره تلاش کنید.');
    } catch {
      setError('ارتباط با سرور برقرار نشد.');
    } finally {
      setBusy(false);
      setArmed(false);
    }
  }

  return (
    <div className='mt-2'>
      <button type='button' onClick={go} disabled={busy} className={'rounded-full px-4 py-2 text-sm font-bold ' + (armed ? 'bg-rose text-white' : 'border border-rose text-rose')}>
        {busy ? '...' : armed ? 'مطمئنید؟ دوباره بزنید' : 'پول را برگرداندم'}
      </button>
      {error && <p role='alert' className='mt-1 text-xs text-rose'>{error}</p>}
    </div>
  );
}
