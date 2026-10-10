'use client';

import { useState, type FormEvent } from 'react';

// Pay (again) for an unpaid order: needs the mobile number used for the order.
export default function PayAgainForm({ code }: { code: string }) {
  const [mobile, setMobile] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const res = await fetch('/api/pay/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, mobile }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setError(data.error || 'شروع پرداخت انجام نشد.');
        setBusy(false);
        return;
      }
      window.location.href = data.payUrl;
    } catch {
      setError('ارتباط با سرور برقرار نشد.');
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className='mt-5 grid gap-3 text-start'>
      <label className='text-sm text-ink/70' htmlFor='pay-mobile'>برای پرداخت، شماره موبایل ثبت‌شده در سفارش را وارد کنید</label>
      <input id='pay-mobile' dir='ltr' inputMode='tel' autoComplete='tel' value={mobile} onChange={(e) => setMobile(e.target.value)} placeholder='09123456789'
        className='w-full rounded-xl border border-ink/15 bg-surface px-4 py-3 text-sm text-ink outline-none focus:border-brand' />
      {error && <p role='alert' className='text-sm text-rose'>{error}</p>}
      <button disabled={busy || !mobile.trim()} className='rounded-full bg-brand py-3 font-bold text-white disabled:opacity-50'>
        {busy ? 'در حال انتقال به درگاه...' : 'پرداخت آنلاین'}
      </button>
    </form>
  );
}
