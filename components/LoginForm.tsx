'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useAccount } from '@/components/AccountProvider';

const field = 'w-full rounded-xl border border-ink/15 bg-surface px-4 py-3 text-sm text-ink outline-none focus:border-brand';
const button = 'w-full rounded-2xl bg-brand py-3.5 font-bold text-white disabled:opacity-50';

// Two steps: mobile number -> 6-digit code from SMS. The first successful login creates the account.
export default function LoginForm() {
  const router = useRouter();
  const { refresh } = useAccount();
  const [step, setStep] = useState<'mobile' | 'code'>('mobile');
  const [mobile, setMobile] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [busy, setBusy] = useState(false);
  const [wait, setWait] = useState(0); // seconds until a new code can be requested

  useEffect(() => {
    if (wait <= 0) return;
    const t = setTimeout(() => setWait((w) => w - 1), 1000);
    return () => clearTimeout(t);
  }, [wait]);

  async function call(url: string, body: object) {
    try {
      const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const data = await res.json().catch(() => null);
      return { res, data };
    } catch {
      return { res: null, data: null };
    }
  }

  async function sendCode(e?: FormEvent) {
    e?.preventDefault();
    setError('');
    setInfo('');
    setBusy(true);
    const { res, data } = await call('/api/auth/request', { mobile });
    setBusy(false);
    if (!res) return setError('ارتباط با سرور برقرار نشد.');
    if (res.ok && data?.ok) {
      setStep('code');
      setCode('');
      setWait(data.resendSeconds ?? 60);
      return setInfo('کد ۶ رقمی به شماره شما پیامک شد.');
    }
    // A code was sent a moment ago: go on to the code step instead of showing an error.
    if (res.status === 429 && typeof data?.waitSeconds === 'number') {
      setStep('code');
      setWait(data.waitSeconds);
      return setInfo('کد قبلی را وارد کنید. اگر پیامک نرسیده، کمی بعد کد جدید بگیرید.');
    }
    setError(data?.error || 'ارسال کد انجام نشد. دوباره تلاش کنید.');
  }

  async function verify(e: FormEvent) {
    e.preventDefault();
    setError('');
    setBusy(true);
    const { res, data } = await call('/api/auth/verify', { mobile, code });
    if (!res) {
      setBusy(false);
      return setError('ارتباط با سرور برقرار نشد.');
    }
    if (res.ok && data?.ok) {
      await refresh(); // header and menu switch to "My account"
      router.refresh(); // the page now sees the login cookie and shows the account
      return;
    }
    setBusy(false);
    setError(data?.error || 'ورود انجام نشد. دوباره تلاش کنید.');
    if (data?.attemptsLeft === 0) setStep('mobile'); // that code is locked: start over
  }

  return (
    <section className='rounded-3xl bg-surface p-6'>
      {step === 'mobile' ? (
        <form onSubmit={sendCode} className='space-y-4'>
          <label className='block text-sm font-bold' htmlFor='login-mobile'>شماره موبایل</label>
          <input
            id='login-mobile' dir='ltr' inputMode='numeric' autoComplete='tel' placeholder='09123456789' maxLength={13}
            value={mobile} onChange={(e) => setMobile(e.target.value)} className={field + ' text-left'} required
          />
          <button type='submit' disabled={busy || mobile.trim().length < 10} className={button}>{busy ? 'در حال ارسال…' : 'دریافت کد ورود'}</button>
        </form>
      ) : (
        <form onSubmit={verify} className='space-y-4'>
          <p className='text-sm leading-7 text-ink/70'>کد ارسال‌شده به <span dir='ltr' className='font-bold'>{mobile}</span> را وارد کنید.</p>
          <label className='sr-only' htmlFor='login-code'>کد ورود</label>
          <input
            id='login-code' dir='ltr' inputMode='numeric' autoComplete='one-time-code' placeholder='------' maxLength={6} autoFocus
            value={code} onChange={(e) => setCode(e.target.value)} className={field + ' text-center text-lg tracking-[0.5em]'} required
          />
          <button type='submit' disabled={busy || code.trim().length !== 6} className={button}>{busy ? 'در حال بررسی…' : 'ورود'}</button>
          <div className='flex items-center justify-between text-xs text-ink/70'>
            <button type='button' onClick={() => { setStep('mobile'); setError(''); setInfo(''); }} className='py-2.5 underline'>تغییر شماره</button>
            {wait > 0 ? (
              <span>ارسال دوباره تا {new Intl.NumberFormat('fa-IR').format(wait)} ثانیه دیگر</span>
            ) : (
              <button type='button' onClick={() => void sendCode()} disabled={busy} className='py-2.5 font-bold text-brand underline'>ارسال دوباره کد</button>
            )}
          </div>
        </form>
      )}
      {info && !error && <p aria-live='polite' className='mt-4 text-sm text-ink/70'>{info}</p>}
      {error && <p role='alert' className='mt-4 rounded-2xl bg-rose/10 px-4 py-3 text-sm font-bold text-rose'>{error}</p>}
    </section>
  );
}
