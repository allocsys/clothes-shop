'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';

const MESSAGES: Record<number, string> = {
  401: 'رمز اشتباه است.',
  429: 'تلاش‌های ناموفق زیاد بود. چند دقیقه بعد دوباره امتحان کنید.',
  503: 'رمز مدیریت روی سرور تنظیم نشده است (ADMIN_PASSWORD).',
};

export default function LoginForm() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (busy || !password) return;
    setBusy(true);
    setError('');
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      if (res.ok) {
        router.replace('/admin');
        router.refresh();
        return;
      }
      setError(MESSAGES[res.status] ?? 'خطایی رخ داد. دوباره تلاش کنید.');
    } catch {
      setError('ارتباط با سرور برقرار نشد. دوباره تلاش کنید.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className='mt-6 space-y-4'>
      <label className='block text-sm font-bold' htmlFor='admin-password'>
        رمز مدیریت
      </label>
      <input
        id='admin-password'
        type='password'
        autoComplete='current-password'
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        dir='ltr'
        className='w-full rounded-2xl border border-ink/15 bg-surface px-4 py-3 text-left outline-none focus:border-brand'
      />
      <div aria-live='polite' className='min-h-5 text-sm text-rose'>
        {error}
      </div>
      <button
        type='submit'
        disabled={busy || !password}
        className='w-full rounded-full bg-brand py-3.5 font-bold text-white disabled:opacity-50'
      >
        {busy ? 'در حال ورود…' : 'ورود'}
      </button>
    </form>
  );
}
