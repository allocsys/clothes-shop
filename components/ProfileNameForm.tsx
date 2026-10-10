'use client';

import { useState, type FormEvent } from 'react';

const field = 'w-full rounded-xl border border-ink/15 bg-surface px-4 py-3 text-sm text-ink outline-none focus:border-brand';

// Name and family name, used to fill in the order form later.
export default function ProfileNameForm({ initialName }: { initialName: string }) {
  const [name, setName] = useState(initialName);
  const [saved, setSaved] = useState(initialName);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  async function save(e: FormEvent) {
    e.preventDefault();
    setError('');
    setDone(false);
    setBusy(true);
    try {
      const res = await fetch('/api/account', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name }) });
      const data = await res.json().catch(() => null);
      if (res.ok && data?.ok) {
        setName(data.name);
        setSaved(data.name);
        setDone(true);
      } else {
        setError(data?.error || 'ذخیره انجام نشد. دوباره تلاش کنید.');
      }
    } catch {
      setError('ارتباط با سرور برقرار نشد.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={save} className='mt-5 space-y-3 border-t border-ink/10 pt-5'>
      <label htmlFor='profile-name' className='block text-sm font-bold'>نام و نام خانوادگی</label>
      <input id='profile-name' value={name} onChange={(e) => { setName(e.target.value); setDone(false); }} maxLength={60} autoComplete='name' className={field} placeholder='مثلاً: مریم احمدی' />
      <button type='submit' disabled={busy || name.trim() === saved} className='rounded-2xl bg-brand px-5 py-2.5 text-sm font-bold text-white disabled:opacity-50'>
        {busy ? 'در حال ذخیره…' : 'ذخیره'}
      </button>
      {done && <p aria-live='polite' className='text-sm font-bold text-brand'>ذخیره شد.</p>}
      {error && <p role='alert' className='rounded-2xl bg-rose/10 px-4 py-3 text-sm font-bold text-rose'>{error}</p>}
    </form>
  );
}
