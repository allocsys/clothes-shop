'use client';

import { useState, type FormEvent } from 'react';
import { ADDRESS_LIMIT, type SavedAddress } from '@/lib/addressTypes';

const field = 'w-full rounded-xl border border-ink/15 bg-surface px-4 py-3 text-sm text-ink outline-none focus:border-brand';
const smallBtn = 'rounded-full border border-ink/15 px-3 py-1.5 text-xs font-bold disabled:opacity-50';

type Draft = { title: string; city: string; postalCode: string; address: string; isDefault: boolean };
const emptyDraft: Draft = { title: '', city: '', postalCode: '', address: '', isDefault: false };

// Saved delivery addresses on /account: add, edit, delete (second tap confirms), choose the default.
export default function AddressBook({ initial }: { initial: SavedAddress[] }) {
  const [list, setList] = useState<SavedAddress[]>(initial);
  const [editing, setEditing] = useState<number | 'new' | null>(null);
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [confirmId, setConfirmId] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function call(url: string, method: string, body?: unknown): Promise<boolean> {
    setError('');
    setBusy(true);
    try {
      const res = await fetch(url, { method, headers: body ? { 'Content-Type': 'application/json' } : undefined, body: body ? JSON.stringify(body) : undefined });
      const data = await res.json().catch(() => null);
      if (res.ok && data?.ok) {
        setList(data.addresses);
        return true;
      }
      setError(data?.error || 'انجام نشد. دوباره تلاش کنید.');
      return false;
    } catch {
      setError('ارتباط با سرور برقرار نشد.');
      return false;
    } finally {
      setBusy(false);
    }
  }

  function startNew() {
    setError('');
    setConfirmId(null);
    setDraft(emptyDraft);
    setEditing('new');
  }

  function startEdit(a: SavedAddress) {
    setError('');
    setConfirmId(null);
    setDraft({ title: a.title, city: a.city, postalCode: a.postalCode, address: a.address, isDefault: a.isDefault });
    setEditing(a.id);
  }

  async function save(e: FormEvent) {
    e.preventDefault();
    const ok = editing === 'new' ? await call('/api/account/addresses', 'POST', draft) : await call('/api/account/addresses/' + editing, 'PATCH', draft);
    if (ok) setEditing(null);
  }

  async function remove(id: number) {
    if (confirmId !== id) {
      setConfirmId(id);
      return;
    }
    setConfirmId(null);
    await call('/api/account/addresses/' + id, 'DELETE');
  }

  const set = (k: keyof Draft) => (e: { target: { value: string } }) => setDraft((d) => ({ ...d, [k]: e.target.value }));
  const editingDefault = typeof editing === 'number' && list.find((a) => a.id === editing)?.isDefault;
  const showDefaultBox = list.length > 0 && !editingDefault;

  return (
    <div className='rounded-3xl bg-surface p-6'>
      <h2 className='text-base font-bold'>آدرس‌های من</h2>

      {list.length === 0 && editing === null && <p className='mt-3 text-sm leading-7 text-ink/70'>هنوز آدرسی ذخیره نکرده‌اید. با ذخیره آدرس، هنگام خرید لازم نیست دوباره آن را بنویسید.</p>}

      {list.length > 0 && (
        <ul className='mt-3 space-y-3'>
          {list.map((a) => (
            <li key={a.id} className='rounded-2xl border border-ink/10 p-4'>
              <div className='flex items-center justify-between gap-2'>
                <span className='text-sm font-bold'>{a.title || 'آدرس'}</span>
                {a.isDefault && <span className='rounded-full bg-brand/10 px-3 py-1 text-xs text-brand'>پیش‌فرض</span>}
              </div>
              <p className='mt-2 text-sm leading-7'>{a.city}، {a.address}</p>
              {a.postalCode && <p className='text-xs text-ink/70'>کد پستی: <span dir='ltr'>{a.postalCode}</span></p>}
              <div className='mt-3 flex flex-wrap gap-2'>
                <button type='button' disabled={busy} onClick={() => startEdit(a)} className={smallBtn}>ویرایش</button>
                {!a.isDefault && <button type='button' disabled={busy} onClick={() => call('/api/account/addresses/' + a.id, 'PATCH', { makeDefault: true })} className={smallBtn}>پیش‌فرض کن</button>}
                <button type='button' disabled={busy} onClick={() => remove(a.id)} className={smallBtn + (confirmId === a.id ? ' border-rose text-rose' : '')}>
                  {confirmId === a.id ? 'مطمئنید؟ دوباره بزنید' : 'حذف'}
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {editing !== null ? (
        <form onSubmit={save} className='mt-4 space-y-3 border-t border-ink/10 pt-4'>
          <p className='text-sm font-bold'>{editing === 'new' ? 'آدرس جدید' : 'ویرایش آدرس'}</p>
          <input className={field} placeholder='عنوان (اختیاری، مثلاً خانه)' aria-label='عنوان آدرس' maxLength={30} value={draft.title} onChange={set('title')} />
          <div className='grid grid-cols-2 gap-3'>
            <input className={field} placeholder='شهر' maxLength={60} aria-label='شهر' autoComplete='address-level2' value={draft.city} onChange={set('city')} />
            <input className={field} placeholder='کد پستی (اختیاری)' inputMode='numeric' maxLength={12} aria-label='کد پستی' autoComplete='postal-code' dir='ltr' value={draft.postalCode} onChange={set('postalCode')} />
          </div>
          <textarea className={field + ' min-h-24'} placeholder='آدرس کامل' maxLength={400} aria-label='آدرس کامل' autoComplete='street-address' value={draft.address} onChange={set('address')} />
          {showDefaultBox && (
            <label className='flex items-center gap-2 text-sm'>
              <input type='checkbox' checked={draft.isDefault} onChange={(e) => setDraft((d) => ({ ...d, isDefault: e.target.checked }))} />
              این آدرس پیش‌فرض باشد
            </label>
          )}
          <div className='flex gap-2'>
            <button type='submit' disabled={busy} className='rounded-2xl bg-brand px-5 py-2.5 text-sm font-bold text-white disabled:opacity-50'>{busy ? 'در حال ذخیره…' : 'ذخیره'}</button>
            <button type='button' disabled={busy} onClick={() => { setEditing(null); setError(''); }} className='rounded-2xl border border-ink/15 px-5 py-2.5 text-sm font-bold disabled:opacity-50'>انصراف</button>
          </div>
        </form>
      ) : list.length < ADDRESS_LIMIT ? (
        <button type='button' disabled={busy} onClick={startNew} className='mt-4 rounded-2xl border border-brand px-5 py-2.5 text-sm font-bold text-brand disabled:opacity-50'>افزودن آدرس</button>
      ) : (
        <p className='mt-4 text-xs text-ink/70'>به حداکثر تعداد آدرس رسیده‌اید. برای افزودن آدرس جدید، یکی را حذف کنید.</p>
      )}

      {error && <p role='alert' className='mt-3 rounded-2xl bg-rose/10 px-4 py-3 text-sm font-bold text-rose'>{error}</p>}
    </div>
  );
}
